package com.travel.marketplace.modules.notification.email;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailMessage {
    private String from;
    private String to;
    private String subject;
    private String html;
    private String text;
    @Builder.Default
    private boolean isHtml = true;
    private String eventId;

    public boolean isHtml() {
        return isHtml;
    }

    public void setHtml(boolean html) {
        this.isHtml = html;
    }
}
