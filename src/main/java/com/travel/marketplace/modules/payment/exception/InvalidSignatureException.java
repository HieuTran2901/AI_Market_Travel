package com.travel.marketplace.modules.payment.exception;

public class InvalidSignatureException extends GatewayException {
    
    public InvalidSignatureException(String message) {
        super(message);
    }
    
    public InvalidSignatureException(String message, Throwable cause) {
        super(message, cause);
    }
}
