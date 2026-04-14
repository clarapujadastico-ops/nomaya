#import <Foundation/Foundation.h>

#if __has_attribute(swift_private)
#define AC_SWIFT_PRIVATE __attribute__((swift_private))
#else
#define AC_SWIFT_PRIVATE
#endif

/// The "Chevron" asset catalog image resource.
static NSString * const ACImageNameChevron AC_SWIFT_PRIVATE = @"Chevron";

/// The "amex-logo" asset catalog image resource.
static NSString * const ACImageNameAmexLogo AC_SWIFT_PRIVATE = @"amex-logo";

/// The "cartes-bancaires-logo" asset catalog image resource.
static NSString * const ACImageNameCartesBancairesLogo AC_SWIFT_PRIVATE = @"cartes-bancaires-logo";

/// The "discover-logo" asset catalog image resource.
static NSString * const ACImageNameDiscoverLogo AC_SWIFT_PRIVATE = @"discover-logo";

/// The "error" asset catalog image resource.
static NSString * const ACImageNameError AC_SWIFT_PRIVATE = @"error";

/// The "mastercard-logo" asset catalog image resource.
static NSString * const ACImageNameMastercardLogo AC_SWIFT_PRIVATE = @"mastercard-logo";

/// The "visa-logo" asset catalog image resource.
static NSString * const ACImageNameVisaLogo AC_SWIFT_PRIVATE = @"visa-logo";

/// The "visa-white-logo" asset catalog image resource.
static NSString * const ACImageNameVisaWhiteLogo AC_SWIFT_PRIVATE = @"visa-white-logo";

#undef AC_SWIFT_PRIVATE
