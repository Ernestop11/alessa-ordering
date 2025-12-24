#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(BluetoothPrinterPlugin, "BluetoothPrinter",
    CAP_PLUGIN_METHOD(listPairedPrinters, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(connect, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(disconnect, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(print, CAPPluginReturnPromise);
)

