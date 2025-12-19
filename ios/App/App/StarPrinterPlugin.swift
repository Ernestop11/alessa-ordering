import Foundation
import Capacitor
import StarIO10
import ExternalAccessory

@objc(StarPrinterPlugin)
public class StarPrinterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StarPrinterPlugin"
    public let jsName = "StarPrinter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "discoverPrinters", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listConnectedAccessories", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disconnect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "printReceipt", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "printRawText", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise)
    ]

    private var starManager: StarDeviceDiscoveryManager?
    private var currentPrinter: StarPrinter?
    private var discoveredPrinters: [StarPrinter] = []

    // MARK: - List Already Connected Accessories (via EAAccessoryManager)
    @objc func listConnectedAccessories(_ call: CAPPluginCall) {
        print("[StarPrinter] listConnectedAccessories called")
        print("[StarPrinter] Checking EAAccessoryManager for already paired devices...")

        let accessoryManager = EAAccessoryManager.shared()
        let connectedAccessories = accessoryManager.connectedAccessories

        print("[StarPrinter] Found \(connectedAccessories.count) connected accessories")

        var foundPrinters: [[String: Any]] = []

        for accessory in connectedAccessories {
            print("[StarPrinter] Accessory: \(accessory.name)")
            print("[StarPrinter]   Manufacturer: \(accessory.manufacturer)")
            print("[StarPrinter]   Model: \(accessory.modelNumber)")
            print("[StarPrinter]   Serial: \(accessory.serialNumber)")
            print("[StarPrinter]   Protocols: \(accessory.protocolStrings)")
            print("[StarPrinter]   Connected: \(accessory.isConnected)")
            print("[StarPrinter]   ConnectionID: \(accessory.connectionID)")

            // Check if this is a Star printer
            let isStarPrinter = accessory.protocolStrings.contains("jp.star-m.starpro")

            let printerInfo: [String: Any] = [
                "name": accessory.name,
                "manufacturer": accessory.manufacturer,
                "model": accessory.modelNumber,
                "serial": accessory.serialNumber,
                "protocols": accessory.protocolStrings,
                "isConnected": accessory.isConnected,
                "connectionID": accessory.connectionID,
                "isStarPrinter": isStarPrinter,
                // Use BT: prefix for Star Bluetooth identifier
                "identifier": "BT:\(accessory.serialNumber)"
            ]

            foundPrinters.append(printerInfo)

            if isStarPrinter {
                print("[StarPrinter] *** STAR PRINTER FOUND! ***")
            }
        }

        call.resolve([
            "accessories": foundPrinters,
            "count": connectedAccessories.count
        ])
    }

    // MARK: - Discover Printers (StarIO10 + EAAccessoryManager fallback)
    @objc func discoverPrinters(_ call: CAPPluginCall) {
        print("[StarPrinter] discoverPrinters called")

        // FIRST: Check EAAccessoryManager for already paired/connected devices
        print("[StarPrinter] Step 1: Checking EAAccessoryManager for paired devices...")
        let accessoryManager = EAAccessoryManager.shared()
        let connectedAccessories = accessoryManager.connectedAccessories
        print("[StarPrinter] EAAccessoryManager found \(connectedAccessories.count) connected accessories")

        var eaPrinters: [[String: Any]] = []
        for accessory in connectedAccessories {
            print("[StarPrinter] EA Accessory: \(accessory.name) - Protocols: \(accessory.protocolStrings)")
            if accessory.protocolStrings.contains("jp.star-m.starpro") {
                print("[StarPrinter] *** STAR PRINTER ALREADY CONNECTED: \(accessory.name) ***")
                eaPrinters.append([
                    "identifier": "BT:\(accessory.serialNumber)",
                    "interfaceType": "bluetooth",
                    "model": accessory.modelNumber,
                    "name": accessory.name,
                    "source": "EAAccessoryManager"
                ])
            }
        }

        // If we found Star printers via EAAccessoryManager, return immediately
        if !eaPrinters.isEmpty {
            print("[StarPrinter] Returning \(eaPrinters.count) printers from EAAccessoryManager")
            call.resolve(["printers": eaPrinters])
            return
        }

        // SECOND: Try StarIO10 discovery
        print("[StarPrinter] Step 2: No EA printers found, trying StarIO10 discovery...")

        Task {
            do {
                // Try ALL interface types - Bluetooth Classic (MFi), BLE, and LAN
                print("[StarPrinter] Creating discovery manager for ALL interfaces...")
                print("[StarPrinter] Interfaces: .bluetooth (MFi), .bluetoothLE, .lan")

                starManager = try StarDeviceDiscoveryManagerFactory.create(
                    interfaceTypes: [.bluetooth, .bluetoothLE, .lan]
                )
                print("[StarPrinter] Discovery manager created successfully")

                starManager?.delegate = self
                starManager?.discoveryTime = 15000 // 15 seconds for thorough scan

                discoveredPrinters = []

                print("[StarPrinter] Starting discovery...")
                try starManager?.startDiscovery()
                print("[StarPrinter] Discovery started, waiting 15 seconds...")

                // Wait for discovery to complete
                try await Task.sleep(nanoseconds: 15_000_000_000) // 15 seconds

                print("[StarPrinter] Discovery complete. Found \(discoveredPrinters.count) printers")

                // Return discovered printers
                let printers = discoveredPrinters.map { printer -> [String: Any] in
                    let interfaceType: String
                    switch printer.connectionSettings.interfaceType {
                    case .bluetooth:
                        interfaceType = "bluetooth"
                    case .bluetoothLE:
                        interfaceType = "bluetoothLE"
                    case .lan:
                        interfaceType = "lan"
                    case .usb:
                        interfaceType = "usb"
                    @unknown default:
                        interfaceType = "unknown"
                    }
                    print("[StarPrinter] Found: \(printer.connectionSettings.identifier) via \(interfaceType)")
                    return [
                        "identifier": printer.connectionSettings.identifier,
                        "interfaceType": interfaceType,
                        "model": printer.information?.model.rawValue ?? "Unknown",
                        "source": "StarIO10"
                    ]
                }

                call.resolve([
                    "printers": printers
                ])

            } catch let error as StarIO10Error {
                print("[StarPrinter] StarIO10 Error: \(error)")
                call.reject("Discovery failed: \(error.localizedDescription). Make sure Bluetooth is enabled and the printer is powered on.")
            } catch {
                print("[StarPrinter] Error: \(error)")
                call.reject("Discovery failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func connect(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier") else {
            call.reject("Printer identifier required")
            return
        }

        let interfaceTypeStr = call.getString("interfaceType") ?? "bluetooth"

        Task {
            do {
                // Determine interface type from string
                let interfaceType: InterfaceType
                switch interfaceTypeStr {
                case "bluetoothLE":
                    interfaceType = .bluetoothLE
                case "lan":
                    interfaceType = .lan
                case "usb":
                    interfaceType = .usb
                default:
                    interfaceType = .bluetooth
                }

                print("[StarPrinter] Connecting to \(identifier) via \(interfaceTypeStr)")
                let settings = StarConnectionSettings(interfaceType: interfaceType, identifier: identifier)
                currentPrinter = StarPrinter(settings)

                try await currentPrinter?.open()
                print("[StarPrinter] Connected successfully!")

                call.resolve([
                    "connected": true,
                    "identifier": identifier,
                    "interfaceType": interfaceTypeStr
                ])
            } catch {
                print("[StarPrinter] Connection failed: \(error)")
                call.reject("Connection failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func disconnect(_ call: CAPPluginCall) {
        Task {
            do {
                try await currentPrinter?.close()
                currentPrinter = nil
                call.resolve(["disconnected": true])
            } catch {
                call.reject("Disconnect failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func printReceipt(_ call: CAPPluginCall) {
        guard let currentPrinter = currentPrinter else {
            call.reject("No printer connected")
            return
        }

        guard let content = call.getString("content") else {
            call.reject("Print content required")
            return
        }

        // Optional parameters
        let customerName = call.getString("customerName") ?? ""
        let orderId = call.getString("orderId") ?? ""
        let total = call.getString("total") ?? ""
        let items = call.getArray("items") as? [[String: Any]] ?? []
        let notes = call.getString("notes") ?? ""

        Task {
            do {
                let builder = StarXpandCommand.StarXpandCommandBuilder()

                _ = builder.addDocument(StarXpandCommand.DocumentBuilder()
                    .addPrinter(StarXpandCommand.PrinterBuilder()
                        // Initialize
                        .styleAlignment(.center)
                        .styleBold(true)
                        .actionPrintText("ORDER #\(orderId.prefix(8))\n")
                        .styleBold(false)
                        .actionPrintText("--------------------------------\n")

                        // Customer info
                        .styleAlignment(.left)
                        .actionPrintText("Customer: \(customerName)\n\n")

                        // Items
                        .actionPrintText(content)

                        // Total
                        .actionPrintText("\n--------------------------------\n")
                        .styleBold(true)
                        .actionPrintText("TOTAL: \(total)\n")
                        .styleBold(false)

                        // Notes
                        .actionPrintText(notes.isEmpty ? "" : "\nNotes: \(notes)\n")

                        // Cut paper
                        .actionCut(.partial)
                    )
                )

                let commands = builder.getCommands()
                try await currentPrinter.print(command: commands)

                call.resolve(["success": true])
            } catch {
                call.reject("Print failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func printRawText(_ call: CAPPluginCall) {
        guard let currentPrinter = currentPrinter else {
            call.reject("No printer connected")
            return
        }

        guard let text = call.getString("text") else {
            call.reject("Text content required")
            return
        }

        let cut = call.getBool("cut") ?? true

        // IMPORTANT: TSP100III series is a graphics-only printer
        // It does NOT support actionPrintText - must use actionPrintImage
        // For now, we'll try actionPrintText first (works on mC-Print, TSP650, etc.)
        // If it fails with TSP100III, need to render text as image

        Task {
            do {
                let builder = StarXpandCommand.StarXpandCommandBuilder()

                var printerBuilder = StarXpandCommand.PrinterBuilder()
                    .actionPrintText(text)

                if cut {
                    printerBuilder = printerBuilder.actionCut(.partial)
                }

                _ = builder.addDocument(StarXpandCommand.DocumentBuilder()
                    .addPrinter(printerBuilder)
                )

                let commands = builder.getCommands()
                try await currentPrinter.print(command: commands)

                call.resolve(["success": true])
            } catch {
                print("[StarPrinter] Print failed (may be TSP100III which requires image printing): \(error)")
                call.reject("Print failed: \(error.localizedDescription). Note: TSP100III requires image-based printing, not text.")
            }
        }
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        guard let currentPrinter = currentPrinter else {
            call.reject("No printer connected")
            return
        }

        Task {
            do {
                let status = try await currentPrinter.getStatus()

                call.resolve([
                    "online": !status.hasError,
                    "coverOpen": status.coverOpen,
                    "paperEmpty": status.paperEmpty,
                    "paperNearEmpty": status.paperNearEmpty
                ])
            } catch {
                call.reject("Status check failed: \(error.localizedDescription)")
            }
        }
    }
}

// MARK: - StarDeviceDiscoveryManagerDelegate
extension StarPrinterPlugin: StarDeviceDiscoveryManagerDelegate {
    public func manager(_ manager: StarDeviceDiscoveryManager, didFind printer: StarPrinter) {
        let interfaceType: String
        switch printer.connectionSettings.interfaceType {
        case .bluetooth:
            interfaceType = "bluetooth"
        case .bluetoothLE:
            interfaceType = "bluetoothLE"
        case .lan:
            interfaceType = "lan"
        case .usb:
            interfaceType = "usb"
        @unknown default:
            interfaceType = "unknown"
        }

        print("[StarPrinter] FOUND PRINTER: \(printer.connectionSettings.identifier) via \(interfaceType)")
        discoveredPrinters.append(printer)

        // Notify JS side about discovered printer
        notifyListeners("printerFound", data: [
            "identifier": printer.connectionSettings.identifier,
            "interfaceType": interfaceType
        ])
    }

    public func managerDidFinishDiscovery(_ manager: StarDeviceDiscoveryManager) {
        print("[StarPrinter] Discovery finished. Total printers: \(discoveredPrinters.count)")
        notifyListeners("discoveryFinished", data: [
            "count": discoveredPrinters.count
        ])
    }
}
