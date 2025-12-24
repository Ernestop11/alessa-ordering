import Foundation
import Capacitor
import ExternalAccessory

@objc(BluetoothPrinterPlugin)
public class BluetoothPrinterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BluetoothPrinterPlugin"
    public let jsName = "BluetoothPrinter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "listPairedPrinters", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disconnect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "print", returnType: CAPPluginReturnPromise)
    ]
    
    private var currentAccessory: EAAccessory?
    private var currentSession: EASession?
    
    @objc func listPairedPrinters(_ call: CAPPluginCall) {
        print("[BluetoothPrinter] listPairedPrinters called")
        
        let accessoryManager = EAAccessoryManager.shared()
        let connectedAccessories = accessoryManager.connectedAccessories
        
        print("[BluetoothPrinter] Found \(connectedAccessories.count) connected accessories")
        
        var printers: [[String: Any]] = []
        
        for accessory in connectedAccessories {
            print("[BluetoothPrinter] Accessory: \(accessory.name)")
            print("[BluetoothPrinter]   Protocols: \(accessory.protocolStrings)")
            
            // Check for common printer protocols or printer in name
            let isPrinter = accessory.protocolStrings.contains { proto in
                let p = proto.lowercased()
                return p.contains("star")
                    || p.contains("brother")
                    || p.contains("printer")
                    || p.contains("serial")
                    || p.contains("escpos")
            } || accessory.name.lowercased().contains("printer")
            
            if isPrinter {
                printers.append([
                    "identifier": accessory.serialNumber,
                    "name": accessory.name,
                    "manufacturer": accessory.manufacturer,
                    "model": accessory.modelNumber,
                    "protocols": accessory.protocolStrings,
                    "isConnected": accessory.isConnected,
                    "connectionID": accessory.connectionID
                ])
                print("[BluetoothPrinter] *** PRINTER FOUND: \(accessory.name) ***")
            }
        }
        
        call.resolve(["printers": printers, "count": printers.count])
    }
    
    @objc func connect(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier") else {
            call.reject("Printer identifier required")
            return
        }
        
        print("[BluetoothPrinter] Connecting to printer: \(identifier)")
        
        let accessoryManager = EAAccessoryManager.shared()
        let accessories = accessoryManager.connectedAccessories
        
        guard let accessory = accessories.first(where: { $0.serialNumber == identifier }) else {
            call.reject("Printer not found. Make sure it's paired in iPad Settings > Bluetooth and powered on.")
            return
        }
        
        // Use first available protocol
        guard let protocolString = accessory.protocolStrings.first else {
            call.reject("No protocol available for this printer")
            return
        }
        
        print("[BluetoothPrinter] Using protocol: \(protocolString)")
        
        let session = EASession(accessory: accessory, forProtocol: protocolString)
        
        if session == nil {
            call.reject("Failed to create session with printer")
            return
        }
        
        if !session!.open() {
            call.reject("Failed to open session with printer")
            return
        }
        
        currentAccessory = accessory
        currentSession = session
        
        print("[BluetoothPrinter] ✅ Connected successfully")
        call.resolve(["connected": true, "protocol": protocolString, "name": accessory.name])
    }
    
    @objc func print(_ call: CAPPluginCall) {
        guard let text = call.getString("text") else {
            call.reject("Print text required")
            return
        }
        
        guard let session = currentSession else {
            call.reject("Not connected to printer. Call connect() first")
            return
        }
        
        guard let outputStream = session.outputStream else {
            call.reject("Output stream not available")
            return
        }
        
        guard outputStream.hasSpaceAvailable else {
            call.reject("Output stream not ready")
            return
        }
        
        guard let data = text.data(using: .utf8) else {
            call.reject("Failed to encode text data")
            return
        }
        
        var bytesWritten = 0
        var totalBytes = data.count
        var offset = 0
        
        // Write data in chunks
        while offset < totalBytes {
            let chunkSize = min(512, totalBytes - offset)
            let chunk = data.subdata(in: offset..<(offset + chunkSize))
            
            let written = outputStream.write(chunk.bytes, maxLength: chunkSize)
            
            if written < 0 {
                call.reject("Failed to write to printer: \(outputStream.streamError?.localizedDescription ?? "Unknown error")")
                return
            }
            
            bytesWritten += written
            offset += written
            
            // Small delay between chunks
            Thread.sleep(forTimeInterval: 0.01)
        }
        
        print("[BluetoothPrinter] ✅ Printed \(bytesWritten) bytes")
        call.resolve(["bytesWritten": bytesWritten, "success": true])
    }
    
    @objc func disconnect(_ call: CAPPluginCall) {
        if let session = currentSession {
            session.close()
            print("[BluetoothPrinter] Session closed")
        }
        currentSession = nil
        currentAccessory = nil
        call.resolve(["disconnected": true])
    }
}

// Helper extension for Data to access bytes
extension Data {
    var bytes: [UInt8] {
        return Array(self)
    }
}

