package com.travel.marketplace.modules.user.service;

import com.travel.marketplace.exception.ResourceNotFoundException;
import com.travel.marketplace.modules.user.dto.UserResponse;
import com.travel.marketplace.modules.user.dto.UserMapper;
import com.travel.marketplace.modules.user.entity.User;
import com.travel.marketplace.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = getUserByEmail(email);
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
