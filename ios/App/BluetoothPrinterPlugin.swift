import Foundation
import Capacitor
import ExternalAccessory

@objc(BluetoothPrinterPlugin)
public class BluetoothPrinterPlugin: CAPPlugin {

    private var session: EASession?
    private var currentAccessory: EAAccessory?

    @objc func listPairedPrinters(_ call: CAPPluginCall) {
        let accessories = EAAccessoryManager.shared().connectedAccessories
        
        var printers: [[String: Any]] = []
        
        for accessory in accessories {
            let isPrinter = accessory.protocolStrings.contains { proto in
                let p = proto.lowercased()
                return p.contains("star") || p.contains("brother") || 
                       p.contains("printer") || p.contains("serial") || 
                       p.contains("escpos")
            } || accessory.name.lowercased().contains("printer")
            
            if isPrinter {
                printers.append([
                    "identifier": accessory.serialNumber,
                    "name": accessory.name,
                    "manufacturer": accessory.manufacturer,
                    "model": accessory.modelNumber,
                    "protocols": accessory.protocolStrings,
                    "isConnected": accessory.isConnected
                ])
            }
        }
        
        call.resolve(["printers": printers, "count": printers.count])
    }

    @objc func connect(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier") else {
            call.reject("Missing identifier")
            return
        }

        let accessories = EAAccessoryManager.shared().connectedAccessories
        guard let accessory = accessories.first(where: { $0.serialNumber == identifier }) else {
            call.reject("Printer not found. Make sure it's paired in iPad Settings > Bluetooth")
            return
        }

        guard let protocolString = accessory.protocolStrings.first else {
            call.reject("No protocol available for this printer")
            return
        }

        guard let newSession = EASession(accessory: accessory, forProtocol: protocolString) else {
            call.reject("Failed to create session")
            return
        }

        // Schedule streams on run loop
        newSession.outputStream?.schedule(in: RunLoop.current, forMode: .default)
        newSession.outputStream?.open()

        session = newSession
        currentAccessory = accessory
        call.resolve(["connected": true, "protocol": protocolString])
    }

    @objc func disconnect(_ call: CAPPluginCall) {
        if let outputStream = session?.outputStream {
            outputStream.close()
            outputStream.remove(from: RunLoop.current, forMode: .default)
        }
        session = nil
        currentAccessory = nil
        call.resolve(["disconnected": true])
    }

    @objc func print(_ call: CAPPluginCall) {
        guard let text = call.getString("text") else {
            call.reject("Missing text")
            return
        }

        guard let session = session, let outputStream = session.outputStream else {
            call.reject("No active session")
            return
        }

        guard outputStream.hasSpaceAvailable else {
            call.reject("Output stream not ready")
            return
        }

        guard let data = text.data(using: .utf8) else {
            call.reject("Failed to encode text")
            return
        }

        var bytesWritten = 0
        var offset = 0
        
        while offset < data.count {
            let chunkSize = min(512, data.count - offset)
            let chunk = data.subdata(in: offset..<(offset + chunkSize))
            
            let written = outputStream.write(chunk.bytes, maxLength: chunkSize)
            
            if written < 0 {
                call.reject("Failed to write to printer")
                return
            }
            
            bytesWritten += written
            offset += written
            Thread.sleep(forTimeInterval: 0.01)
        }

        call.resolve(["bytesWritten": bytesWritten, "success": true])
    }
}

// Helper extension for Data
extension Data {
    var bytes: [UInt8] {
        return Array(self)
    }
}
