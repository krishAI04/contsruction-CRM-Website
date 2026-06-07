from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import serializers

from leads.models import Lead, LeadSource, LostReason
from leads.services import PipelineService
from proposals.models import Proposal

User = get_user_model()


class PipelineServiceTests(TestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username="manager",
            email="manager@test.local",
            password="pass12345",
            role=User.Role.MANAGER,
        )
        self.executive = User.objects.create_user(
            username="sales",
            email="sales@test.local",
            password="pass12345",
            role=User.Role.EXECUTIVE,
        )
        self.source = LeadSource.objects.create(name="Website")
        self.lost_reason = LostReason.objects.create(name="Budget mismatch")
        self.lead = Lead.objects.create(
            name="Test Lead",
            email="lead@test.local",
            phone="+910000000000",
            source=self.source,
            project_type=Lead.ProjectType.RESIDENTIAL,
            budget=Decimal("1000000"),
            assigned_to=self.executive,
            created_by=self.manager,
        )

    def test_lost_requires_reason(self):
        with self.assertRaises(serializers.ValidationError):
            PipelineService.move_stage(lead=self.lead, target_stage=Lead.Stage.LOST, user=self.manager)

    def test_won_requires_manager_approved_proposal_and_deal_value(self):
        with self.assertRaises(serializers.ValidationError):
            PipelineService.move_stage(lead=self.lead, target_stage=Lead.Stage.WON, user=self.executive, deal_value=Decimal("950000"))

        Proposal.objects.create(
            lead=self.lead,
            title="Approved proposal",
            proposal_text="Scope",
            amount=Decimal("950000"),
            status=Proposal.Status.APPROVED,
            created_by=self.manager,
            approved_by=self.manager,
        )
        updated = PipelineService.move_stage(
            lead=self.lead,
            target_stage=Lead.Stage.WON,
            user=self.manager,
            deal_value=Decimal("950000"),
        )
        self.assertEqual(updated.stage, Lead.Stage.WON)

