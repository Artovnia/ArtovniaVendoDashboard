import { Text, clx } from "@medusajs/ui";

type NotificationBadgeProps = {
  count?: number;
  showCount?: boolean;
  className?: string;
};

/**
 * A small notification badge to indicate unread items
 * Can optionally display a count
 */
export const NotificationBadge = ({ 
  count = 0, 
  showCount = false,
  className = ""
}: NotificationBadgeProps) => {
  if (count <= 0) return null;
  
  return (
    <div 
      className={clx(
        "bg-ui-tag-red-bg text-ui-tag-red flex items-center justify-center rounded-full",
        showCount ? "min-w-5 h-5 px-1" : "w-2 h-2",
        className
      )}
    >
      {showCount && count > 0 && (
        <Text
          size="xsmall"
          leading="compact"
          weight="plus"
          className="text-ui-tag-red"
        >
          {count > 99 ? "99+" : count}
        </Text>
      )}
    </div>
  );
};
