package com.travel.marketplace.modules.inventory.repository;

import com.travel.marketplace.modules.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findAllByListingId(Long listingId);

    @Modifying
    @Query("UPDATE Inventory i SET i.deletedAt = :now WHERE i.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("now") Instant now);
}
