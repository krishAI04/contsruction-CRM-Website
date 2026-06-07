from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import LoginView, MeView
from accounts.views import UserViewSet
from ai.views import AIScoreLeadView, AIFollowUpView, AIProposalView, AIMeetingSummaryView
from communications.views import EmailMessageViewSet
from clients.views import ClientViewSet
from dashboard.views import DashboardFunnelView, DashboardOverviewView, DashboardSalesPerformanceView, DashboardSourcesView
from leads.views import LeadSourceViewSet, LeadViewSet, LostReasonViewSet
from meetings.views import MeetingViewSet
from proposals.views import ProposalViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("leads", LeadViewSet, basename="lead")
router.register("lead-sources", LeadSourceViewSet, basename="lead-source")
router.register("lost-reasons", LostReasonViewSet, basename="lost-reason")
router.register("proposals", ProposalViewSet, basename="proposal")
router.register("communications/emails", EmailMessageViewSet, basename="email-message")
router.register("meetings", MeetingViewSet, basename="meeting")
router.register("clients", ClientViewSet, basename="client")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login", LoginView.as_view(), name="login"),
    path("api/auth/token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me", MeView.as_view(), name="me"),
    path("api/ai/score-lead", AIScoreLeadView.as_view(), name="ai_score_lead"),
    path("api/ai/follow-up", AIFollowUpView.as_view(), name="ai_follow_up"),
    path("api/ai/proposal", AIProposalView.as_view(), name="ai_proposal"),
    path("api/ai/meeting-summary", AIMeetingSummaryView.as_view(), name="ai_meeting_summary"),
    path("api/dashboard/overview", DashboardOverviewView.as_view(), name="dashboard_overview"),
    path("api/dashboard/sources", DashboardSourcesView.as_view(), name="dashboard_sources"),
    path("api/dashboard/funnel", DashboardFunnelView.as_view(), name="dashboard_funnel"),
    path("api/dashboard/sales-performance", DashboardSalesPerformanceView.as_view(), name="dashboard_sales_performance"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
