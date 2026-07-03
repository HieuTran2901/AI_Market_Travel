package com.travel.marketplace.modules.payment.exception;

public class GatewayTimeoutException extends GatewayException {
    
    public GatewayTimeoutException(String message) {
        super(message);
    }
    
    public GatewayTimeoutException(String message, Throwable cause) {
        super(message, cause);
    }
}
