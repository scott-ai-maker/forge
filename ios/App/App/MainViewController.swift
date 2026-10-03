import UIKit
import Capacitor
import WebKit

@objc(MainViewController)
public class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        let healthKitPlugin = GAAHealthKitPlugin()
        bridge?.registerPluginInstance(healthKitPlugin)
    }

    override open var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }

    override open func viewDidLoad() {
        super.viewDidLoad()
        
        // Native performance optimizations & eliminate pull-down empty gap
        if let webView = self.webView {
            webView.isOpaque = false
            let obsidian = UIColor(red: 8/255.0, green: 14/255.0, blue: 20/255.0, alpha: 1.0)
            webView.backgroundColor = obsidian
            webView.scrollView.backgroundColor = obsidian
            webView.scrollView.bounces = false
            webView.scrollView.alwaysBounceVertical = false
            webView.scrollView.alwaysBounceHorizontal = false
            webView.scrollView.contentInsetAdjustmentBehavior = .never
            webView.scrollView.showsVerticalScrollIndicator = false
            webView.scrollView.showsHorizontalScrollIndicator = false
        }
    }
}
