from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from activities.models import Activity
from ai.models import AIOutput
from communications.models import EmailMessage
from accounts.models import Organization
from leads.models import Lead, LeadSource, LostReason
from proposals.models import Proposal

User = get_user_model()


class Command(BaseCommand):
    help = "Seed BuildFlow demo users and CRM data."

    def handle(self, *args, **options):
        password = "BuildFlow@123"
        organization, _ = Organization.objects.get_or_create(
            name="BuildFlow Construction",
            defaults={"access_password": "BuildFlowOrg@123"},
        )
        organization.access_password = "BuildFlowOrg@123"
        organization.save(update_fields=["access_password"])
        users = {
            "admin": self.user("admin@buildflow.test", "admin", User.Role.ADMIN, password, organization, "Delhi, Noida, Gurgaon"),
            "admin2": self.user("opsadmin@buildflow.test", "opsadmin", User.Role.ADMIN, password, organization, "Mumbai, Pune"),
            "manager": self.user("manager@buildflow.test", "manager", User.Role.MANAGER, password, organization, "Delhi, Noida"),
            "manager2": self.user("westmanager@buildflow.test", "westmanager", User.Role.MANAGER, password, organization, "Mumbai, Pune"),
            "sales": self.user("sales@buildflow.test", "sales", User.Role.EXECUTIVE, password, organization, "Delhi, Noida"),
            "sales2": self.user("rahul@buildflow.test", "rahul", User.Role.EXECUTIVE, password, organization, "Gurgaon, Faridabad"),
            "sales3": self.user("amit@buildflow.test", "amit", User.Role.EXECUTIVE, password, organization, "Mumbai, Pune"),
            "viewer": self.user("viewer@buildflow.test", "viewer", User.Role.VIEWER, password, organization, ""),
        }
        sources = {
            name: LeadSource.objects.get_or_create(name=name)[0]
            for name in ["Instagram Ads", "Facebook Ads", "Website Form", "Referral", "Walk-in"]
        }
        lost_reasons = {
            name: LostReason.objects.get_or_create(name=name)[0]
            for name in ["Budget mismatch", "Competitor Selected", "Too Expensive", "No Response"]
        }

        leads = [
            ("Rohit Sharma", "rohit@example.com", "+919000000001", "Instagram Ads", Lead.ProjectType.RESIDENTIAL, 4500000, Lead.Timeline.ONE_MONTH, Lead.Stage.SITE_VISIT_SCHEDULED, 8800000, None),
            ("Priya Mehta", "priya@example.com", "+919000000002", "Website Form", Lead.ProjectType.OFFICE, 1200000, Lead.Timeline.IMMEDIATE, Lead.Stage.PROPOSAL_SENT, 0, None),
            ("Ankit Jain", "ankit@example.com", "+919000000003", "Facebook Ads", Lead.ProjectType.RENOVATION, 850000, Lead.Timeline.THREE_MONTHS, Lead.Stage.CONTACTED, 0, None),
            ("Neha Verma", "neha@example.com", "+919000000004", "Referral", Lead.ProjectType.VILLA, 7500000, Lead.Timeline.ONE_MONTH, Lead.Stage.NEGOTIATION, 0, None),
            ("Sameer Khan", "sameer@example.com", "+919000000005", "Walk-in", Lead.ProjectType.RENOVATION, 300000, Lead.Timeline.NOT_DECIDED, Lead.Stage.LOST, 0, lost_reasons["Budget mismatch"]),
        ]

        assignee_cycle = [users["sales"], users["sales2"], users["sales3"], users["sales"], users["sales2"]]
        for index, (name, email, phone, source, project_type, budget, timeline, stage, deal_value, reason) in enumerate(leads):
            lead, _ = Lead.objects.update_or_create(
                phone=phone,
                defaults={
                    "name": name,
                    "email": email,
                    "city": "Delhi",
                    "source": sources[source],
                    "project_type": project_type,
                    "budget": Decimal(budget),
                    "timeline": timeline,
                    "stage": stage,
                    "notes": "Client is evaluating premium material options and expects clear next steps.",
                    "assigned_to": assignee_cycle[index],
                    "assignment_method": "seed_demo",
                    "assignment_reason": "Demo distribution across the sales team.",
                    "created_by": users["manager"],
                    "deal_value": Decimal(deal_value) if deal_value else None,
                    "lost_reason": reason,
                },
            )
            Activity.objects.get_or_create(
                lead=lead,
                type=Activity.Type.NOTE,
                description="Demo lead created.",
                created_by=users["manager"],
            )
            if not AIOutput.objects.filter(lead=lead, feature_type=AIOutput.FeatureType.LEAD_SCORE).exists():
                AIOutput.objects.create(
                    lead=lead,
                    feature_type=AIOutput.FeatureType.LEAD_SCORE,
                    provider="mock",
                    input_snapshot={"lead_id": lead.id},
                    output_json={"score": 76, "reason": "Demo score", "recommended_action": "Follow up today"},
                    created_by=users["manager"],
                )
            if not lead.proposals.exists() and stage in {Lead.Stage.PROPOSAL_SENT, Lead.Stage.NEGOTIATION}:
                Proposal.objects.create(
                    lead=lead,
                    title=f"{lead.get_project_type_display()} Proposal for {lead.name}",
                    proposal_text="Demo proposal draft with scope, estimate, timeline, terms, and next steps.",
                    amount=lead.budget,
                    created_by=users["manager"],
                )
            EmailMessage.objects.get_or_create(
                lead=lead,
                recipient=lead.email,
                subject=f"Next steps for your {lead.get_project_type_display()}",
                defaults={"body": "Thanks for your interest. Sharing next steps for your project.", "created_by": users["sales"]},
            )

        self.stdout.write(self.style.SUCCESS("BuildFlow demo data seeded."))

    def user(self, email, username, role, password, organization, city_coverage):
        user, created = User.objects.get_or_create(email=email, defaults={"username": username, "role": role})
        user.role = role
        user.username = username
        user.organization = organization
        user.city_coverage = city_coverage
        user.team_visibility = role in {User.Role.ADMIN, User.Role.MANAGER}
        user.is_staff = role == User.Role.ADMIN
        user.is_superuser = role == User.Role.ADMIN
        user.set_password(password)
        user.save()
        return user
