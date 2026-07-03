package com.travel.marketplace.modules.user.service;

import com.travel.marketplace.modules.user.dto.UserResponse;
import com.travel.marketplace.modules.user.entity.User;

public interface UserService {
    UserResponse getCurrentUser(String email);
    User getUserByEmail(String email);
}
