// Email Service - Reutilizabil pentru NFT, Newsletter, etc.

class EmailService {
  constructor() {
    this.backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://backend-server-eu.onrender.com';
  }

  // Send NFT via email
  async sendNFT(emailData) {
    try {
      console.log('📧 Sending NFT via email...');
      
      const response = await fetch(`${this.backendUrl}/api/email/send-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ NFT email sent successfully!');
      return result;

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  // Send newsletter subscription
  async subscribeNewsletter(emailData) {
    try {
      console.log('📧 Subscribing to newsletter...');
      
      const response = await fetch(`${this.backendUrl}/api/email/newsletter-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Newsletter subscription successful!');
      return result;

    } catch (error) {
      console.error('❌ Newsletter subscription failed:', error);
      throw error;
    }
  }

  // Send general email
  async sendEmail(emailData) {
    try {
      console.log('📧 Sending email...');
      
      const response = await fetch(`${this.backendUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Email sent successfully!');
      return result;

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Format NFT email data
  formatNFTEmailData(email, nftImageUrl, userInfo, analysisData) {
    return {
      to: email,
      subject: 'Your Unique BitSwapDEX AI Neuropsychological NFT',
      type: 'nft',
      data: {
        nftImageUrl,
        userInfo,
        analysisData,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Format newsletter email data
  formatNewsletterData(email, userInfo = {}) {
    return {
      email,
      userInfo,
      timestamp: new Date().toISOString(),
      source: 'mind_mirror'
    };
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;





