import axios, { AxiosInstance } from 'axios';

export interface GooglePlayCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export interface SubscriptionPurchaseResponse {
  kind: string;
  developerId: string;
  packageName: string;
  subscriptionId: string;
  token: string;
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  developerPayload: string;
  paymentState: number; // 1 = Paid, 0 = Free trial
  cancellationTimeMillis?: string;
  cancelReason?: number;
  orderId: string;
  linkedPurchaseToken?: string;
  productId?: string;
  profileName?: string;
  profileId?: string;
  purchaseType?: number;
  acknowledgementState: number; // 0 = Unacknowledged, 1 = Acknowledged
}

export interface ProductPurchaseResponse {
  orderId: string;
  purchaseTimeMillis: string;
  purchaseState: number; // 0 = Purchased, 1 = Cancelled
  developerId: string;
  packageName: string;
  productId: string;
  token: string;
  autoRenewing?: boolean;
  acknowledgementState: number;
}

export interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

class GooglePlayService {
  private packageName: string;
  private credentials: GooglePlayCredentials;
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(packageName: string, credentials: GooglePlayCredentials) {
    this.packageName = packageName;
    this.credentials = credentials;
    this.axiosInstance = axios.create({
      baseURL: 'https://androidpublisher.googleapis.com/androidpublisher',
      timeout: 10000,
    });
  }

  /**
   * Get access token from Google OAuth 2.0
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const jwt = this.generateJWT();
      const response = await axios.post<AccessTokenResponse>(
        this.credentials.token_uri,
        {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000 - 60000; // Refresh 1 minute before expiry

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Google Play access token:', error);
      throw new Error('Failed to authenticate with Google Play API');
    }
  }

  /**
   * Generate JWT for service account authentication
   */
  private generateJWT(): string {
    const crypto = require('crypto');
    const jwt = require('jsonwebtoken');

    const payload = {
      iss: this.credentials.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: this.credentials.token_uri,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, this.credentials.private_key, {
      algorithm: 'RS256',
      header: {
        kid: this.credentials.private_key_id,
      },
    });
  }

  /**
   * Verify subscription purchase
   * @param subscriptionId - SKU ID (e.g., 'pharmacy_monthly')
   * @param token - Purchase token from client
   */
  async verifySubscriptionPurchase(
    subscriptionId: string,
    token: string
  ): Promise<SubscriptionPurchaseResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get<SubscriptionPurchaseResponse>(
        `/v3/applications/${this.packageName}/subscriptions/${subscriptionId}/tokens/${token}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Validate response
      this.validateSubscriptionPurchase(response.data);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          throw new Error('Purchase token not found or invalid');
        } else if (status === 400) {
          throw new Error('Invalid subscription ID or token format');
        } else if (status === 401) {
          throw new Error('Authentication failed with Google Play API');
        }
      }
      throw error;
    }
  }

  /**
   * Verify product purchase (one-time products, not subscriptions)
   */
  async verifyProductPurchase(
    productId: string,
    token: string
  ): Promise<ProductPurchaseResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.axiosInstance.get<ProductPurchaseResponse>(
        `/v3/applications/${this.packageName}/purchases/products/${productId}/tokens/${token}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Validate response
      this.validateProductPurchase(response.data);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          throw new Error('Product purchase not found or invalid');
        } else if (status === 400) {
          throw new Error('Invalid product ID or token format');
        }
      }
      throw error;
    }
  }

  /**
   * Validate subscription purchase response
   */
  private validateSubscriptionPurchase(purchase: SubscriptionPurchaseResponse): void {
    // Check if purchase is valid
    if (!purchase.token) {
      throw new Error('Invalid purchase response: missing token');
    }

    if (!purchase.expiryTimeMillis) {
      throw new Error('Invalid purchase response: missing expiry time');
    }

    // Check if subscription is active (paymentState = 1)
    if (purchase.paymentState !== 1) {
      throw new Error('Subscription payment not completed');
    }

    // Check if subscription has expired
    const expiryDate = new Date(parseInt(purchase.expiryTimeMillis));
    if (expiryDate < new Date()) {
      throw new Error('Subscription has expired');
    }

    // Check if subscription is cancelled
    if (purchase.cancelReason !== undefined && purchase.cancelReason !== null) {
      throw new Error('Subscription has been cancelled');
    }
  }

  /**
   * Validate product purchase response
   */
  private validateProductPurchase(purchase: ProductPurchaseResponse): void {
    // Check if purchase is valid
    if (!purchase.token) {
      throw new Error('Invalid purchase response: missing token');
    }

    // Check if purchase is completed (purchaseState = 0)
    if (purchase.purchaseState !== 0) {
      throw new Error('Product purchase is cancelled or pending');
    }

    // Check if purchase time is within reasonable bounds
    const purchaseDate = new Date(parseInt(purchase.purchaseTimeMillis));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (purchaseDate < thirtyDaysAgo) {
      console.warn('Product purchase is older than 30 days');
    }
  }

  /**
   * Acknowledge subscription purchase
   */
  async acknowledgeSubscriptionPurchase(
    subscriptionId: string,
    token: string
  ): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();

      await this.axiosInstance.post(
        `/v3/applications/${this.packageName}/subscriptions/${subscriptionId}/tokens/${token}:acknowledge`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.error('Failed to acknowledge subscription purchase:', error);
      // Non-blocking error - don't fail the operation
    }
  }

  /**
   * Get subscription purchase information by order ID
   */
  async getSubscriptionByOrderId(
    subscriptionId: string,
    orderId: string
  ): Promise<SubscriptionPurchaseResponse | null> {
    try {
      const accessToken = await this.getAccessToken();

      // Note: Google Play API doesn't have a direct way to search by order ID
      // This would need to be done by storing the token locally and looking it up
      // This is a placeholder for documentation purposes
      
      console.log(`Searching for order ${orderId} in subscription ${subscriptionId}`);
      return null;
    } catch (error) {
      console.error('Failed to get subscription by order ID:', error);
      return null;
    }
  }

  /**
   * Verify webhook signature from Google Play
   */
  static verifyWebhookSignature(
    message: string,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      const crypto = require('crypto');
      
      const verifier = crypto.createVerify('RSA-SHA1');
      verifier.update(message);
      
      return verifier.verify(publicKey, signature, 'base64');
    } catch (error) {
      console.error('Failed to verify webhook signature:', error);
      return false;
    }
  }
}

export default GooglePlayService;
