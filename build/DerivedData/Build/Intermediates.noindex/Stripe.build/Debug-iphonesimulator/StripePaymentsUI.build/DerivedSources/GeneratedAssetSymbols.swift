import Foundation
#if canImport(AppKit)
import AppKit
#endif
#if canImport(UIKit)
import UIKit
#endif
#if canImport(SwiftUI)
import SwiftUI
#endif
#if canImport(DeveloperToolsSupport)
import DeveloperToolsSupport
#endif

#if SWIFT_PACKAGE
private let resourceBundle = Foundation.Bundle.module
#else
private class ResourceBundleClass {}
private let resourceBundle = Foundation.Bundle(for: ResourceBundleClass.self)
#endif

// MARK: - Color Symbols -

@available(iOS 11.0, macOS 10.13, tvOS 11.0, *)
extension ColorResource {

}

// MARK: - Image Symbols -

@available(iOS 11.0, macOS 10.7, tvOS 11.0, *)
extension ImageResource {

    /// The "anz" asset catalog image resource.
    static let anz = ImageResource(name: "anz", bundle: resourceBundle)

    /// The "bankofmelbourne" asset catalog image resource.
    static let bankofmelbourne = ImageResource(name: "bankofmelbourne", bundle: resourceBundle)

    /// The "banksa" asset catalog image resource.
    static let banksa = ImageResource(name: "banksa", bundle: resourceBundle)

    /// The "bankwest" asset catalog image resource.
    static let bankwest = ImageResource(name: "bankwest", bundle: resourceBundle)

    /// The "boq" asset catalog image resource.
    static let boq = ImageResource(name: "boq", bundle: resourceBundle)

    /// The "cba" asset catalog image resource.
    static let cba = ImageResource(name: "cba", bundle: resourceBundle)

    /// The "nab" asset catalog image resource.
    static let nab = ImageResource(name: "nab", bundle: resourceBundle)

    /// The "stgeorges" asset catalog image resource.
    static let stgeorges = ImageResource(name: "stgeorges", bundle: resourceBundle)

    /// The "stp_card_amex" asset catalog image resource.
    static let stpCardAmex = ImageResource(name: "stp_card_amex", bundle: resourceBundle)

    /// The "stp_card_amex_template" asset catalog image resource.
    static let stpCardAmexTemplate = ImageResource(name: "stp_card_amex_template", bundle: resourceBundle)

    /// The "stp_card_applepay" asset catalog image resource.
    static let stpCardApplepay = ImageResource(name: "stp_card_applepay", bundle: resourceBundle)

    /// The "stp_card_cartes_bancaires" asset catalog image resource.
    static let stpCardCartesBancaires = ImageResource(name: "stp_card_cartes_bancaires", bundle: resourceBundle)

    /// The "stp_card_cartes_bancaires_template" asset catalog image resource.
    static let stpCardCartesBancairesTemplate = ImageResource(name: "stp_card_cartes_bancaires_template", bundle: resourceBundle)

    /// The "stp_card_cbc" asset catalog image resource.
    static let stpCardCbc = ImageResource(name: "stp_card_cbc", bundle: resourceBundle)

    /// The "stp_card_cvc" asset catalog image resource.
    static let stpCardCvc = ImageResource(name: "stp_card_cvc", bundle: resourceBundle)

    /// The "stp_card_cvc_amex" asset catalog image resource.
    static let stpCardCvcAmex = ImageResource(name: "stp_card_cvc_amex", bundle: resourceBundle)

    /// The "stp_card_diners" asset catalog image resource.
    static let stpCardDiners = ImageResource(name: "stp_card_diners", bundle: resourceBundle)

    /// The "stp_card_diners_template" asset catalog image resource.
    static let stpCardDinersTemplate = ImageResource(name: "stp_card_diners_template", bundle: resourceBundle)

    /// The "stp_card_discover" asset catalog image resource.
    static let stpCardDiscover = ImageResource(name: "stp_card_discover", bundle: resourceBundle)

    /// The "stp_card_discover_template" asset catalog image resource.
    static let stpCardDiscoverTemplate = ImageResource(name: "stp_card_discover_template", bundle: resourceBundle)

    /// The "stp_card_error" asset catalog image resource.
    static let stpCardError = ImageResource(name: "stp_card_error", bundle: resourceBundle)

    /// The "stp_card_jcb" asset catalog image resource.
    static let stpCardJcb = ImageResource(name: "stp_card_jcb", bundle: resourceBundle)

    /// The "stp_card_jcb_template" asset catalog image resource.
    static let stpCardJcbTemplate = ImageResource(name: "stp_card_jcb_template", bundle: resourceBundle)

    /// The "stp_card_mastercard" asset catalog image resource.
    static let stpCardMastercard = ImageResource(name: "stp_card_mastercard", bundle: resourceBundle)

    /// The "stp_card_mastercard_template" asset catalog image resource.
    static let stpCardMastercardTemplate = ImageResource(name: "stp_card_mastercard_template", bundle: resourceBundle)

    /// The "stp_card_unionpay" asset catalog image resource.
    static let stpCardUnionpay = ImageResource(name: "stp_card_unionpay", bundle: resourceBundle)

    /// The "stp_card_unionpay_template" asset catalog image resource.
    static let stpCardUnionpayTemplate = ImageResource(name: "stp_card_unionpay_template", bundle: resourceBundle)

    /// The "stp_card_unknown" asset catalog image resource.
    static let stpCardUnknown = ImageResource(name: "stp_card_unknown", bundle: resourceBundle)

    /// The "stp_card_unpadded_amex" asset catalog image resource.
    static let stpCardUnpaddedAmex = ImageResource(name: "stp_card_unpadded_amex", bundle: resourceBundle)

    /// The "stp_card_unpadded_cartes_bancaires" asset catalog image resource.
    static let stpCardUnpaddedCartesBancaires = ImageResource(name: "stp_card_unpadded_cartes_bancaires", bundle: resourceBundle)

    /// The "stp_card_unpadded_diners_club" asset catalog image resource.
    static let stpCardUnpaddedDinersClub = ImageResource(name: "stp_card_unpadded_diners_club", bundle: resourceBundle)

    /// The "stp_card_unpadded_discover" asset catalog image resource.
    static let stpCardUnpaddedDiscover = ImageResource(name: "stp_card_unpadded_discover", bundle: resourceBundle)

    /// The "stp_card_unpadded_jcb" asset catalog image resource.
    static let stpCardUnpaddedJcb = ImageResource(name: "stp_card_unpadded_jcb", bundle: resourceBundle)

    /// The "stp_card_unpadded_mastercard" asset catalog image resource.
    static let stpCardUnpaddedMastercard = ImageResource(name: "stp_card_unpadded_mastercard", bundle: resourceBundle)

    /// The "stp_card_unpadded_unionpay" asset catalog image resource.
    static let stpCardUnpaddedUnionpay = ImageResource(name: "stp_card_unpadded_unionpay", bundle: resourceBundle)

    /// The "stp_card_unpadded_visa" asset catalog image resource.
    static let stpCardUnpaddedVisa = ImageResource(name: "stp_card_unpadded_visa", bundle: resourceBundle)

    /// The "stp_card_visa" asset catalog image resource.
    static let stpCardVisa = ImageResource(name: "stp_card_visa", bundle: resourceBundle)

    /// The "stp_card_visa_template" asset catalog image resource.
    static let stpCardVisaTemplate = ImageResource(name: "stp_card_visa_template", bundle: resourceBundle)

    /// The "stp_icon_bank" asset catalog image resource.
    static let stpIconBank = ImageResource(name: "stp_icon_bank", bundle: resourceBundle)

    /// The "stp_icon_bank_link" asset catalog image resource.
    static let stpIconBankLink = ImageResource(name: "stp_icon_bank_link", bundle: resourceBundle)

    /// The "stripe" asset catalog image resource.
    static let stripe = ImageResource(name: "stripe", bundle: resourceBundle)

    /// The "suncorpmetway" asset catalog image resource.
    static let suncorpmetway = ImageResource(name: "suncorpmetway", bundle: resourceBundle)

    /// The "westpac" asset catalog image resource.
    static let westpac = ImageResource(name: "westpac", bundle: resourceBundle)

}

// MARK: - Backwards Deployment Support -

/// A color resource.
struct ColorResource: Swift.Hashable, Swift.Sendable {

    /// An asset catalog color resource name.
    fileprivate let name: Swift.String

    /// An asset catalog color resource bundle.
    fileprivate let bundle: Foundation.Bundle

    /// Initialize a `ColorResource` with `name` and `bundle`.
    init(name: Swift.String, bundle: Foundation.Bundle) {
        self.name = name
        self.bundle = bundle
    }

}

/// An image resource.
struct ImageResource: Swift.Hashable, Swift.Sendable {

    /// An asset catalog image resource name.
    fileprivate let name: Swift.String

    /// An asset catalog image resource bundle.
    fileprivate let bundle: Foundation.Bundle

    /// Initialize an `ImageResource` with `name` and `bundle`.
    init(name: Swift.String, bundle: Foundation.Bundle) {
        self.name = name
        self.bundle = bundle
    }

}

#if canImport(AppKit)
@available(macOS 10.13, *)
@available(macCatalyst, unavailable)
extension AppKit.NSColor {

    /// Initialize a `NSColor` with a color resource.
    convenience init(resource: ColorResource) {
        self.init(named: NSColor.Name(resource.name), bundle: resource.bundle)!
    }

}

protocol _ACResourceInitProtocol {}
extension AppKit.NSImage: _ACResourceInitProtocol {}

@available(macOS 10.7, *)
@available(macCatalyst, unavailable)
extension _ACResourceInitProtocol {

    /// Initialize a `NSImage` with an image resource.
    init(resource: ImageResource) {
        self = resource.bundle.image(forResource: NSImage.Name(resource.name))! as! Self
    }

}
#endif

#if canImport(UIKit)
@available(iOS 11.0, tvOS 11.0, *)
@available(watchOS, unavailable)
extension UIKit.UIColor {

    /// Initialize a `UIColor` with a color resource.
    convenience init(resource: ColorResource) {
#if !os(watchOS)
        self.init(named: resource.name, in: resource.bundle, compatibleWith: nil)!
#else
        self.init()
#endif
    }

}

@available(iOS 11.0, tvOS 11.0, *)
@available(watchOS, unavailable)
extension UIKit.UIImage {

    /// Initialize a `UIImage` with an image resource.
    convenience init(resource: ImageResource) {
#if !os(watchOS)
        self.init(named: resource.name, in: resource.bundle, compatibleWith: nil)!
#else
        self.init()
#endif
    }

}
#endif

#if canImport(SwiftUI)
@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
extension SwiftUI.Color {

    /// Initialize a `Color` with a color resource.
    init(_ resource: ColorResource) {
        self.init(resource.name, bundle: resource.bundle)
    }

}

@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
extension SwiftUI.Image {

    /// Initialize an `Image` with an image resource.
    init(_ resource: ImageResource) {
        self.init(resource.name, bundle: resource.bundle)
    }

}
#endif