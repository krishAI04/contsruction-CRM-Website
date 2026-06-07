from io import BytesIO

from django.core.files.base import ContentFile
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from activities.models import Activity


class ProposalService:
    @staticmethod
    def approve(proposal, user):
        if not user.can_manage:
            raise PermissionError("Only managers and admins can approve proposals.")
        proposal.status = proposal.Status.APPROVED
        proposal.approved_by = user
        proposal.approved_at = timezone.now()
        proposal.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])
        Activity.objects.create(
            lead=proposal.lead,
            type=Activity.Type.PROPOSAL,
            description=f"Proposal approved: {proposal.title}.",
            created_by=user,
        )
        return proposal

    @staticmethod
    def generate_pdf(proposal):
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        y = height - 72
        pdf.setFont("Helvetica-Bold", 18)
        pdf.drawString(72, y, "BuildFlow CRM Proposal")
        y -= 32
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(72, y, proposal.title[:90])
        y -= 28
        pdf.setFont("Helvetica", 10)
        pdf.drawString(72, y, f"Client: {proposal.lead.name} | Amount: Rs. {proposal.amount}")
        y -= 30
        pdf.setFont("Helvetica", 10)
        for paragraph in proposal.proposal_text.splitlines():
            words = paragraph.split()
            line = ""
            for word in words:
                if len(line + " " + word) > 88:
                    pdf.drawString(72, y, line)
                    y -= 15
                    line = word
                else:
                    line = f"{line} {word}".strip()
            if line:
                pdf.drawString(72, y, line)
                y -= 15
            y -= 6
            if y < 72:
                pdf.showPage()
                pdf.setFont("Helvetica", 10)
                y = height - 72
        pdf.save()
        proposal.pdf_file.save(f"proposal-{proposal.id}.pdf", ContentFile(buffer.getvalue()), save=True)
        return proposal.pdf_file

