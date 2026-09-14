package com.yuvan.busbooking.location.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.location.dto.LocationRequest;
import com.yuvan.busbooking.location.dto.LocationResponse;
import com.yuvan.busbooking.location.entity.Location;
import com.yuvan.busbooking.location.repository.LocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public LocationResponse create(LocationRequest request) {

        Location location = new Location();

        location.setName(request.name());
        location.setCity(request.city());
        location.setState(request.state());
        location.setCountry(request.country());
        location.setLatitude(request.latitude());
        location.setLongitude(request.longitude());

        return toResponse(locationRepository.save(location));
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> findAll() {

        return locationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LocationResponse findById(Long id) {

        Location location = locationRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Location not found: " + id
                        )
                );

        return toResponse(location);
    }

    public LocationResponse update(
            Long id,
            LocationRequest request
    ) {

        Location location = locationRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Location not found: " + id
                        )
                );

        location.setName(request.name());
        location.setCity(request.city());
        location.setState(request.state());
        location.setCountry(request.country());
        location.setLatitude(request.latitude());
        location.setLongitude(request.longitude());

        return toResponse(locationRepository.save(location));
    }

    public void delete(Long id) {

        if (!locationRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Location not found: " + id
            );
        }

        locationRepository.deleteById(id);
    }

    private LocationResponse toResponse(Location location) {

        return new LocationResponse(
                location.getId(),
                location.getName(),
                location.getCity(),
                location.getState(),
                location.getCountry(),
                location.getLatitude(),
                location.getLongitude(),
                location.getCreatedAt(),
                location.getUpdatedAt()
        );
    }
    
}