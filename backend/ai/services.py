import json

from django.conf import settings


class AIService:
    @staticmethod
    def _as_list(value):
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []

    @staticmethod
    def _normalize_output(feature, output, mock_output):
        if not isinstance(output, dict):
            return mock_output
        if feature == "lead_score":
            return {
                "score": int(output.get("score") or output.get("lead_score") or mock_output.get("score") or 0),
                "reason": output.get("reason") or output.get("score_reason") or output.get("rationale") or mock_output.get("reason", ""),
                "recommended_action": output.get("recommended_action") or output.get("next_action") or mock_output.get("recommended_action", ""),
            }
        if feature == "follow_up":
            return {
                "email_message": output.get("email_message") or output.get("email") or output.get("email_body") or mock_output.get("email_message", ""),
                "call_script": output.get("call_script") or output.get("call") or output.get("phone_script") or mock_output.get("call_script", ""),
                "whatsapp_text": output.get("whatsapp_text") or output.get("whatsapp") or output.get("whatsapp_copy") or mock_output.get("whatsapp_text", ""),
            }
        if feature == "proposal":
            proposal_text = output.get("proposal_text") or output.get("proposal") or output.get("content") or output.get("body") or mock_output.get("proposal_text", "")
            if isinstance(proposal_text, dict):
                proposal_text = "\n\n".join(f"{key}\n{value}" for key, value in proposal_text.items())
            return {
                "title": output.get("title") or output.get("proposal_title") or mock_output.get("title", "Construction Proposal"),
                "proposal_text": str(proposal_text or ""),
                "amount": output.get("amount") or output.get("estimate") or output.get("price") or mock_output.get("amount", 1),
            }
        if feature == "meeting_summary":
            return {
                "summary": output.get("summary") or output.get("meeting_summary") or output.get("overview") or mock_output.get("summary", ""),
                "action_items": AIService._as_list(output.get("action_items") or output.get("actions") or output.get("next_steps")) or mock_output.get("action_items", []),
                "risks": AIService._as_list(output.get("risks") or output.get("risk_factors") or output.get("concerns")) or mock_output.get("risks", []),
                "next_follow_up_date": output.get("next_follow_up_date") or output.get("next_follow_up") or output.get("follow_up_date") or mock_output.get("next_follow_up_date"),
            }
        return output

    @staticmethod
    def _lead_snapshot(lead):
        if not lead:
            return {}
        return {
            "id": lead.id,
            "name": lead.name,
            "budget": float(lead.budget or 0),
            "project_type": lead.project_type,
            "timeline": lead.timeline,
            "stage": lead.stage,
            "notes": lead.notes,
        }

    @staticmethod
    def _mock_score(lead):
        budget = float(lead.budget or 0)
        score = 45
        if budget >= 5000000:
            score += 25
        elif budget >= 1000000:
            score += 15
        if lead.timeline in ("immediate", "one_month"):
            score += 15
        if lead.stage in ("site_visit_scheduled", "site_visit_completed", "proposal_sent", "negotiation"):
            score += 10
        if "premium" in (lead.notes or "").lower():
            score += 5
        score = min(score, 95)
        return {
            "score": score,
            "reason": "Score based on budget, timeline urgency, engagement stage, and notes.",
            "recommended_action": "Send a tailored follow-up and move toward proposal approval.",
        }

    @staticmethod
    def generate_lead_score(lead):
        return AIService._with_gemini_or_mock(
            feature="lead_score",
            prompt=f"Score this construction CRM lead. Return JSON with exactly these keys: score, reason, recommended_action. Lead: {AIService._lead_snapshot(lead)}",
            mock=lambda: AIService._mock_score(lead),
        )

    @staticmethod
    def generate_followup(lead):
        name = lead.name if lead else "Client"
        project = lead.get_project_type_display() if lead else "your project"
        return AIService._with_gemini_or_mock(
            feature="follow_up",
            prompt=f"Create sales follow-up copy. Return JSON with exactly these keys: email_message, call_script, whatsapp_text. Lead: {AIService._lead_snapshot(lead)}",
            mock=lambda: {
                "email_message": f"Hi {name}, thank you for discussing {project} with UrbanNest Constructions. We can prepare a clear estimate and next-step plan after confirming your site details and timeline.",
                "call_script": f"Confirm {name}'s project scope, budget comfort, timeline, site visit availability, and decision process.",
                "whatsapp_text": f"Hi {name}, thanks for your interest in UrbanNest. I can share the next steps and estimate for your {project}. What time is good for a quick call?",
            },
        )

    @staticmethod
    def generate_proposal(lead):
        name = lead.name if lead else "Client"
        project = lead.get_project_type_display() if lead else "Construction Project"
        budget = lead.budget or 0
        return AIService._with_gemini_or_mock(
            feature="proposal",
            prompt=f"Write a practical construction proposal using the lead notes, budget, project type, timeline, stage, and all CRM context. Return JSON with exactly these keys: title, proposal_text, amount. Proposal text must include Project Understanding, Scope of Work, Timeline, Pricing, Terms, and Next Steps. Lead: {AIService._lead_snapshot(lead)}",
            mock=lambda: {
                "title": f"{project} Proposal for {name}",
                "proposal_text": (
                    f"Project Understanding\nUrbanNest understands that {name} is planning {project}.\n\n"
                    "Scope of Work\nSite assessment, planning support, material coordination, execution milestones, and final handover.\n\n"
                    "Estimated Timeline\nTimeline will be finalized after site visit and scope confirmation.\n\n"
                    f"Price Estimate\nIndicative estimate: Rs. {budget}.\n\n"
                    "Terms and Assumptions\nFinal pricing depends on site condition, selected materials, and approved drawings.\n\n"
                    "Next Steps\nApprove the draft scope and schedule a site visit."
                ),
                "amount": float(budget or 0),
            },
        )

    @staticmethod
    def summarize_meeting(raw_notes):
        return AIService._with_gemini_or_mock(
            feature="meeting_summary",
            prompt=f"Summarize this construction sales meeting. Return JSON with exactly these keys: summary, action_items, risks, next_follow_up_date. Raw notes: {raw_notes}",
            mock=lambda: {
                "summary": raw_notes[:240] if raw_notes else "Meeting notes captured.",
                "action_items": ["Prepare estimate", "Confirm site visit", "Share material options"],
                "risks": ["Budget and finish quality may need alignment"],
                "next_follow_up_date": None,
            },
        )

    @staticmethod
    def _with_gemini_or_mock(feature, prompt, mock):
        if settings.AI_MODE != "gemini" or not settings.GEMINI_API_KEY:
            reason = "AI_MODE is not gemini" if settings.AI_MODE != "gemini" else "GEMINI_API_KEY is missing"
            return {"provider": "mock", "fallback_used": settings.AI_MODE == "gemini", "fallback_error": reason, "output": mock()}
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = model.generate_content(prompt + "\nReturn only valid JSON. Do not include markdown fences.")
            text = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            mock_output = mock()
            return {"provider": "gemini", "fallback_used": False, "output": AIService._normalize_output(feature, json.loads(text), mock_output)}
        except Exception as exc:
            return {"provider": "mock", "fallback_used": True, "fallback_error": str(exc), "output": mock()}

