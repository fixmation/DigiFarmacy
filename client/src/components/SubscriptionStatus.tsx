import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { Calendar, AlertCircle, Check, DollarSign, X, RefreshCw } from 'lucide-react';

export interface SubscriptionStatusComponentProps {
  onUpgradeClick?: () => void;
  onCancelClick?: () => void;
  compact?: boolean;
}

export const SubscriptionStatusComponent: React.FC<SubscriptionStatusComponentProps> = ({
  onUpgradeClick,
  onCancelClick,
  compact = false,
}) => {
  const { status, loading, error, cancelSubscription } = useSubscription();

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-blue-400 rounded-full animate-pulse" />
            <CardTitle className="text-blue-200">Loading subscription...</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-500/20 border-red-400/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-200">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status?.has_subscription) {
    if (compact) {
      return (
        <div className="text-sm">
          <Badge className="bg-orange-500/30 text-orange-200 border-orange-400/50">
            No active subscription
          </Badge>
        </div>
      );
    }

    return (
      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-400/50">
        <CardHeader>
          <CardTitle className="text-lg">Subscription Required</CardTitle>
          <CardDescription>Upgrade to unlock full features</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Start your subscription to access premium features and get dedicated support.
          </p>
          <Button
            onClick={onUpgradeClick}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const subscription = status.subscription!;
  const isExpiring = subscription.days_remaining <= 7 && subscription.days_remaining > 0;
  const isExpired = subscription.days_remaining <= 0;

  const statusColors = {
    ACTIVE: 'bg-green-500/20 border-green-400/50 text-green-100',
    PAUSED: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-100',
    EXPIRED: 'bg-red-500/20 border-red-400/50 text-red-100',
    CANCELLED: 'bg-gray-500/20 border-gray-400/50 text-gray-100',
  };

  const statusIcons = {
    ACTIVE: <Check className="h-4 w-4 text-green-400" />,
    PAUSED: <RefreshCw className="h-4 w-4 text-yellow-400" />,
    EXPIRED: <AlertCircle className="h-4 w-4 text-red-400" />,
    CANCELLED: <X className="h-4 w-4 text-gray-400" />,
  };

  const expiryDate = new Date(subscription.expires_at);
  const isPharmacy = subscription.business_type === 'pharmacy';
  const businessLabel = isPharmacy ? 'Pharmacy' : 'Laboratory';

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{businessLabel} Subscription</span>
          <Badge
            variant="outline"
            className={`${statusColors[subscription.status as keyof typeof statusColors]}`}
          >
            <span className="flex items-center gap-1">
              {statusIcons[subscription.status as keyof typeof statusIcons]}
              {subscription.status}
            </span>
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Expires in {subscription.days_remaining} days</span>
          <span className="text-primary">{subscription.currency} {subscription.price / 100000}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={`bg-gradient-to-br ${statusColors[subscription.status as keyof typeof statusColors]}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {statusIcons[subscription.status as keyof typeof statusIcons]}
              {businessLabel} Subscription -{' '}
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1).toLowerCase()}
            </CardTitle>
            <CardDescription className="mt-1">SKU: {subscription.sku}</CardDescription>
          </div>
          {onUpgradeClick && subscription.status === 'ACTIVE' && (
            <Button variant="outline" size="sm" onClick={onUpgradeClick}>
              Change Plan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge className={statusColors[subscription.status as keyof typeof statusColors]}>
            {subscription.status}
          </Badge>
        </div>

        {/* Price Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            <span>Price</span>
          </div>
          <span className="font-semibold">
            {subscription.currency} {(subscription.price / 100000).toFixed(2)}
          </span>
        </div>

        {/* Purchase Date */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Purchased</span>
          <span className="text-sm">{new Date(subscription.purchased_at).toLocaleDateString()}</span>
        </div>

        {/* Expiry Date & Countdown */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>Expires</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{expiryDate.toLocaleDateString()}</span>
            {(isExpiring || isExpired) && (
              <Badge
                variant="destructive"
                className={isExpired ? 'bg-red-600' : 'bg-yellow-600'}
              >
                {isExpired ? 'Expired' : `${subscription.days_remaining} days left`}
              </Badge>
            )}
          </div>
        </div>

        {/* Auto-Renewal Status */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-sm">Auto-Renewal</span>
          <div className="flex items-center">
            {subscription.auto_renew ? (
              <Badge variant="outline" className="bg-green-500/20 text-green-200">
                <Check className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-500/20 text-gray-200">
                Disabled
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-white/10">
          {subscription.status === 'ACTIVE' && onCancelClick && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onCancelClick}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Subscription
            </Button>
          )}
          {subscription.status === 'EXPIRED' && onUpgradeClick && (
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={onUpgradeClick}
            >
              Renew Subscription
            </Button>
          )}
        </div>

        {/* Help Text */}
        {isExpiring && subscription.status === 'ACTIVE' && (
          <div className="p-3 bg-white/5 rounded-lg border border-yellow-400/30 text-xs">
            Your subscription expires soon. Enable auto-renewal to ensure continued access.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusComponent;
