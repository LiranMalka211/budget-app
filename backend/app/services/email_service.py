import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """Emails the reset link via SMTP when configured; otherwise logs it so developers can copy it."""
    settings = get_settings()
    if not settings.smtp_host:
        logger.info("Password reset link for %s: %s", to_email, reset_link)
        return

    msg = EmailMessage()
    msg["Subject"] = "Reset your Family Budget password"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.set_content(
        "We received a request to reset your password.\n\n"
        f"Open this link to choose a new one (valid for {settings.reset_token_expire_minutes} minutes):\n{reset_link}\n\n"
        "If you did not ask for this, you can ignore this email."
    )
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        smtp.starttls()
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(msg)
