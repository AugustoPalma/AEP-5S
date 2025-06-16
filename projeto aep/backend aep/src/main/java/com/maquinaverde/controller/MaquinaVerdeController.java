package com.maquinaverde.controller;

import com.maquinaverde.dto.RecycleRequest;
import com.maquinaverde.dto.UserLoginRequest;
import com.maquinaverde.model.User;
import com.maquinaverde.service.MaquinaVerdeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class MaquinaVerdeController {

    @Autowired
    private MaquinaVerdeService service;

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody UserLoginRequest request) {
        return service.login(request.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/recycle")
    public ResponseEntity<User> recycle(@RequestBody RecycleRequest request) {
        try {
            User updatedUser = service.processRecycling(request.getUserId(), request.getBottles(), request.isPrintCoupon());
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/users/{userId}/deactivate-coupons")
    public ResponseEntity<User> deactivateCoupons(@PathVariable String userId) {
        try {
            User updatedUser = service.deactivateAllCoupons(userId);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
