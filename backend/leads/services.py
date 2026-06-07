from django.utils import timezone
from rest_framework import serializers

from activities.models import Activity
from clients.models import Client
from .models import Lead


class PipelineService:
    @staticmethod
    def move_stage(*, lead, target_stage, user, deal_value=None, lost_reason=None):
        if lead.stage == Lead.Stage.WON:
            raise serializers.ValidationError("Won leads are converted to clients and cannot be moved from this action.")
        if lead.stage == Lead.Stage.LOST and target_stage != Lead.Stage.CONTACTED:
            raise serializers.ValidationError("Lost leads can only be reopened to Contacted.")

        if target_stage == Lead.Stage.WON:
            if not user.can_manage:
                raise serializers.ValidationError("Only a Sales Manager or Admin can mark a lead as Won.")
            if deal_value is None and lead.deal_value is None:
                raise serializers.ValidationError("Won leads require a deal value.")
            if not lead.proposals.filter(status="approved").exists():
                raise serializers.ValidationError("Won leads require an approved proposal.")

        if target_stage == Lead.Stage.LOST and not (lost_reason or lead.lost_reason):
            raise serializers.ValidationError("Lost leads require a lost reason.")

        if target_stage == Lead.Stage.PROPOSAL_SENT and not lead.proposals.exists():
            raise serializers.ValidationError("Proposal Sent requires at least one proposal draft.")

        old_stage = lead.stage
        lead.stage = target_stage
        if deal_value is not None:
            lead.deal_value = deal_value
        if lost_reason is not None:
            lead.lost_reason = lost_reason
        if target_stage == Lead.Stage.WON:
            lead.won_date = timezone.now()
        if old_stage == Lead.Stage.LOST and target_stage == Lead.Stage.CONTACTED:
            lead.lost_reason = None
        lead.updated_at = timezone.now()
        lead.save(update_fields=["stage", "deal_value", "lost_reason", "won_date", "updated_at"])

        if target_stage == Lead.Stage.WON:
            Client.objects.get_or_create(
                lead=lead,
                defaults={
                    "name": lead.name,
                    "phone": lead.phone,
                    "email": lead.email,
                    "project_value": lead.deal_value,
                    "project_type": lead.project_type,
                    "created_by": user,
                },
            )

        Activity.objects.create(
            lead=lead,
            type=Activity.Type.STAGE_CHANGED,
            description=f"Stage changed from {old_stage} to {target_stage}.",
            metadata={"from": old_stage, "to": target_stage},
            created_by=user,
        )
        return lead
