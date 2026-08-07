"""
Custom email backend that bypasses SSL certificate verification.
This is needed on Windows where the system SSL cert store may not include
all required intermediate certificates for Gmail's SMTP server.
"""
import ssl
from django.core.mail.backends.smtp import EmailBackend


class SSLUnverifiedEmailBackend(EmailBackend):
    """
    Custom SMTP email backend that uses an unverified SSL context.
    Resolves the 'CERTIFICATE_VERIFY_FAILED' error on Windows.
    """

    def open(self):
        if self.connection:
            return False

        connection_params = {
            'host': self.host,
            'port': self.port,
            'local_hostname': None,
        }

        if self.use_ssl:
            connection_params['context'] = ssl._create_unverified_context()

        import smtplib
        try:
            self.connection = smtplib.SMTP(**connection_params)
            if self.use_tls:
                # Create unverified SSL context for STARTTLS
                context = ssl.create_default_context()
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                self.connection.ehlo()
                self.connection.starttls(context=context)
                self.connection.ehlo()
            if self.username and self.password:
                self.connection.login(self.username, self.password)
            return True
        except Exception:
            if not self.fail_silently:
                raise
