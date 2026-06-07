from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from activities.serializers import ActivitySerializer
from activities.models import Activity
from leads.models import Lead

User = get_user_model()


def scoped_leads_for(user):
    qs = Lead.objects.all()
    if user.organization_id:
        qs = qs.filter(Q(assigned_to__organization=user.organization) | Q(created_by__organization=user.organization))
    if user.role == User.Role.EXECUTIVE and not user.team_visibility:
        qs = qs.filter(assigned_to=user)
    return qs


class DashboardOverviewView(APIView):
    def get(self, request):
        leads = scoped_leads_for(request.user)
        total = leads.count()
        won = leads.filter(stage=Lead.Stage.WON).count()
        lost = leads.filter(stage=Lead.Stage.LOST).count()
        active = leads.exclude(stage__in=[Lead.Stage.WON, Lead.Stage.LOST]).count()
        revenue = leads.filter(stage=Lead.Stage.WON).aggregate(total=Sum("deal_value"))["total"] or 0
        avg_deal = (revenue / won) if won else 0
        conversion = round((won / total) * 100, 2) if total else 0
        recent = Activity.objects.select_related("lead", "created_by").filter(lead__in=leads)[:8]
        return Response({
            "total_leads": total,
            "active_leads": active,
            "won_leads": won,
            "lost_leads": lost,
            "conversion_rate": conversion,
            "estimated_revenue": revenue,
            "average_deal_size": avg_deal,
            "recent_activities": ActivitySerializer(recent, many=True).data,
        })


class DashboardSourcesView(APIView):
    def get(self, request):
        rows = scoped_leads_for(request.user).values("source__name").annotate(count=Count("id")).order_by("-count")
        return Response([{"source": row["source__name"], "count": row["count"]} for row in rows])


class DashboardFunnelView(APIView):
    def get(self, request):
        rows = scoped_leads_for(request.user).values("stage").annotate(count=Count("id"))
        counts = {row["stage"]: row["count"] for row in rows}
        return Response([
            {"stage": value, "label": label, "count": counts.get(value, 0)}
            for value, label in Lead.Stage.choices
        ])


class DashboardSalesPerformanceView(APIView):
    def get(self, request):
        if not request.user.can_manage:
            return Response({"detail": "Only managers and admins can view sales performance."}, status=status.HTTP_403_FORBIDDEN)

        users = User.objects.filter(is_active=True, role=User.Role.EXECUTIVE).order_by("first_name", "email")
        if request.user.organization_id:
            users = users.filter(organization=request.user.organization)

        rows = []
        for user in users:
            leads = Lead.objects.filter(assigned_to=user)
            total = leads.count()
            won = leads.filter(stage=Lead.Stage.WON).count()
            lost = leads.filter(stage=Lead.Stage.LOST).count()
            active = leads.exclude(stage__in=[Lead.Stage.WON, Lead.Stage.LOST]).count()
            contacted = leads.filter(stage__in=[
                Lead.Stage.CONTACTED,
                Lead.Stage.SITE_VISIT_SCHEDULED,
                Lead.Stage.SITE_VISIT_COMPLETED,
                Lead.Stage.PROPOSAL_SENT,
                Lead.Stage.NEGOTIATION,
                Lead.Stage.WON,
            ]).count()
            proposal_sent = leads.filter(stage__in=[Lead.Stage.PROPOSAL_SENT, Lead.Stage.NEGOTIATION, Lead.Stage.WON]).count()
            revenue = leads.filter(stage=Lead.Stage.WON).aggregate(total=Sum("deal_value"))["total"] or 0
            conversion = round((won / total) * 100, 2) if total else 0
            contact_rate = round((contacted / total) * 100, 2) if total else 0
            rows.append({
                "id": user.id,
                "name": user.get_full_name() or user.email,
                "email": user.email,
                "city_coverage": user.city_coverage,
                "assigned_leads": total,
                "active_leads": active,
                "contacted_leads": contacted,
                "proposal_sent": proposal_sent,
                "won_leads": won,
                "lost_leads": lost,
                "conversion_rate": conversion,
                "contact_rate": contact_rate,
                "revenue": revenue,
            })

        return Response(rows)
