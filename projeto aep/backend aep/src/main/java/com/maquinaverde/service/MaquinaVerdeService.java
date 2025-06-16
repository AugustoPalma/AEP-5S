package com.maquinaverde.service;

import com.maquinaverde.model.Coupon;
import com.maquinaverde.model.User;
import com.maquinaverde.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class MaquinaVerdeService {

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void initDatabase() {
        if (userRepository.count() == 0) {
            User user1 = new User();
            user1.setId("123");
            user1.setName("Maria");
            user1.setSaldo(15.00);
            userRepository.save(user1);

            User user2 = new User();
            user2.setId("123456");
            user2.setName("Tester");
            user2.setSaldo(10.00);
            userRepository.save(user2);
        }
    }

    public Optional<User> login(String userId) {
        return userRepository.findById(userId);
    }

    public User processRecycling(String userId, int bottles, boolean printCoupon) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        double valorAdicionado = bottles * 0.50;

        if (printCoupon) {
            Coupon newCoupon = new Coupon();
            newCoupon.setCode("MV-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase());

            newCoupon.setCouponValue(valorAdicionado);

            newCoupon.setStatus("Ativo");
            newCoupon.setUser(user);
            user.getCupons().add(newCoupon);
        } else {
            user.setSaldo(user.getSaldo() + valorAdicionado);
        }
        return userRepository.save(user);
    }

    public User deactivateAllCoupons(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        user.getCupons().forEach(coupon -> coupon.setStatus("Usado"));
        return userRepository.save(user);
    }
}
