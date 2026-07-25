package com.travel.marketplace.modules.payment.controller;

import com.travel.marketplace.modules.payment.momo.MomoIpnRequest;
import com.travel.marketplace.modules.payment.momo.MomoIpnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments/momo")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "payment.momo", name = "enabled", havingValue = "true")
public class MomoIpnController {

    private final MomoIpnService momoIpnService;

    @PostMapping("/ipn")
    public ResponseEntity<Void> handleIpn(@RequestBody MomoIpnRequest request) {
        momoIpnService.process(request);
        return ResponseEntity.noContent().build();
    }
}
