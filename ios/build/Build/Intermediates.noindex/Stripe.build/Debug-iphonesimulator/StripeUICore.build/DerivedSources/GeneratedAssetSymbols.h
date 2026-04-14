#import <Foundation/Foundation.h>

#if __has_attribute(swift_private)
#define AC_SWIFT_PRIVATE __attribute__((swift_private))
#else
#define AC_SWIFT_PRIVATE
#endif

/// The "brand_stripe" asset catalog image resource.
static NSString * const ACImageNameBrandStripe AC_SWIFT_PRIVATE = @"brand_stripe";

/// The "form_error_icon" asset catalog image resource.
static NSString * const ACImageNameFormErrorIcon AC_SWIFT_PRIVATE = @"form_error_icon";

/// The "icon_chevron_down" asset catalog image resource.
static NSString * const ACImageNameIconChevronDown AC_SWIFT_PRIVATE = @"icon_chevron_down";

/// The "icon_clear" asset catalog image resource.
static NSString * const ACImageNameIconClear AC_SWIFT_PRIVATE = @"icon_clear";

#undef AC_SWIFT_PRIVATE
