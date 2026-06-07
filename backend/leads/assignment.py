from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, Q

from .models import AssignmentCursor, Lead

User = get_user_model()

HIGH_BUDGET_THRESHOLD = Decimal("2500000")


class AssignmentService:
    @staticmethod
    def auto_assign(lead):
        executives = User.objects.filter(
            is_active=True,
            role=User.Role.EXECUTIVE,
        ).order_by("id")
        if lead.created_by and lead.created_by.organization_id:
            executives = executives.filter(organization=lead.created_by.organization)

        if not executives.exists():
            return None, "unassigned", "No active sales executive found."

        city_match = AssignmentService._city_match(lead, executives)
        if city_match:
            return city_match, "city_match", f"Matched lead city '{lead.city}' with salesperson city coverage."

        if lead.budget and lead.budget >= HIGH_BUDGET_THRESHOLD:
            best = AssignmentService._best_converter(executives)
            if best:
                return best, "high_budget_conversion", "High budget lead assigned to the best current converter."

        round_robin = AssignmentService._round_robin(executives)
        return round_robin, "round_robin", "No city or budget match, so lead assigned by round robin."

    @staticmethod
    def assign_if_needed(lead, user=None):
        if lead.assigned_to_id:
            return lead
        assignee, method, reason = AssignmentService.auto_assign(lead)
        lead.assigned_to = assignee
        lead.assignment_method = method
        lead.assignment_reason = reason
        lead.save(update_fields=["assigned_to", "assignment_method", "assignment_reason", "updated_at"])
        return lead

    @staticmethod
    def _city_match(lead, executives):
        city = (lead.city or "").strip().lower()
        if not city:
            return None
        for user in executives:
            cities = [item.strip().lower() for item in (user.city_coverage or "").split(",") if item.strip()]
            if city in cities:
                return user
        return None

    @staticmethod
    def _best_converter(executives):
        ranked = executives.annotate(
            total_assigned=Count("assigned_leads", distinct=True),
            won_count=Count("assigned_leads", filter=Q(assigned_leads__stage=Lead.Stage.WON), distinct=True),
        )
        return sorted(
            ranked,
            key=lambda user: (
                (user.won_count / user.total_assigned) if user.total_assigned else 0,
                user.won_count,
                -user.total_assigned,
            ),
            reverse=True,
        )[0]

    @staticmethod
    def _round_robin(executives):
        users = list(executives)
        cursor, _ = AssignmentCursor.objects.get_or_create(name="sales_round_robin")
        start_index = 0
        if cursor.last_user_id:
            for index, user in enumerate(users):
                if user.id == cursor.last_user_id:
                    start_index = (index + 1) % len(users)
                    break
        selected = users[start_index]
        cursor.last_user = selected
        cursor.save(update_fields=["last_user", "updated_at"])
        return selected
