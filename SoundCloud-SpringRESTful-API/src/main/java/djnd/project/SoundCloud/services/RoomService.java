package djnd.project.SoundCloud.services;

import djnd.project.SoundCloud.domain.entity.ListeningRoom;
import djnd.project.SoundCloud.domain.realtime.RoomRealtimeState;
import djnd.project.SoundCloud.domain.request.RoomDTO;
import djnd.project.SoundCloud.domain.response.ResRoom;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.repositories.RoomRepository;
import djnd.project.SoundCloud.repositories.UserRepository;
import djnd.project.SoundCloud.services.realtime.RoomStateManager;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomStateManager roomStateManager;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public ResRoom createRoom(RoomDTO dto) {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        var user = this.userRepository.getReferenceById(userId);
        if (user == null) {
            throw new ResourceNotFoundException("User ID", userId);
        }

        var room = ListeningRoom.builder()
                .name(dto.name())
                .code(dto.code())
                .host(user)
                .isActive(dto.isActive())
                .isPublic(dto.isPublic())
                .password(this.passwordEncoder.encode(dto.password()))
                .maxListeners(50)
                .build();
        var savedRoom = roomRepository.save(room);

        // Initialize realtime state in memory
        roomStateManager.getOrCreateState(savedRoom.getId(), userId);

        return this.toRes(this.roomRepository.findWithIdDetail(savedRoom.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Room ID", savedRoom.getId())));
    }

    public ResRoom toRes(ListeningRoom room) {
        var res = new ResRoom();
        res.setId(room.getId());
        res.setCreatedAt(room.getCreatedAt());
        res.setHostUserId(room.getHost().getId());
        res.setHostUserName(room.getHost().getName());
        res.setIsPublic(room.getIsPublic());
        res.setName(room.getName());
        res.setCode(room.getCode());
        RoomRealtimeState state = this.roomStateManager.getRoomState(room.getId());
        res.setListenerCount(state != null ? state.getConnectedUserIds().size() : 0);
        return res;
    }

    public Optional<ListeningRoom> findById(Long id) {
        return roomRepository.findByIdAndIsActiveTrue(id);
    }

    public List<ListeningRoom> findActivePublicRooms() {
        return roomRepository.findByIsActiveTrueAndIsPublicTrue();
    }

    public List<ResRoom> fetchAll() {
        return this.roomRepository.findAll().stream().map(this::toRes).toList();
    }

    public List<ResRoom> findUserRooms(Long userId) {
        var rooms = this.roomRepository.findByHostIdAndIsActiveTrue(userId);
        return rooms.stream().map(this::toRes).toList();
    }

    public ResultPaginationDTO fetchAllWithPagination(Specification<ListeningRoom> spec, Pageable pageable,
            String key) {
        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        if (key != null && !key.isEmpty()) {
            Specification<ListeningRoom> sp = (r, q, c) -> {
                var codeName = "%" + key.toLowerCase() + "%";
                Predicate searchCode = c.like(c.lower(r.get("code")), codeName);
                Predicate searchName = c.like(c.lower(r.get("name")), codeName);
                return c.or(searchCode, searchName);

            };
            spec = spec.and(sp);
        }
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPages(pageable.getPageSize());

        var page = this.roomRepository.findAll(spec, pageable);
        meta.setPages(page.getTotalPages());
        meta.setTotal(page.getTotalElements());
        res.setMeta(meta);
        res.setResult(page.getContent().stream().map(this::toRes).toList());
        return res;
    }

    @Transactional
    public ListeningRoom updateRoom(Long roomId, String name, String description, Boolean isPublic,
            Long requestUserId) {
        var room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: ", roomId));

        // Verify ownership
        if (!room.getHost().getId().equals(requestUserId)) {
            throw new ResourceNotFoundException("You are not the host of this room", requestUserId);
        }

        if (name != null)
            room.setName(name);

        if (isPublic != null)
            room.setIsPublic(isPublic);

        return roomRepository.save(room);
    }

    @Transactional
    public void deleteRoom(Long roomId, Long requestUserId) {
        var room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: ", roomId));

        // Verify ownership
        if (!room.getHost().getId().equals(requestUserId)) {
            throw new ResourceNotFoundException("Room not found with id: ", requestUserId);
        }

        room.setIsActive(false);
        roomRepository.save(room);

        log.info("Deactivated room: {} by user: {}", roomId, requestUserId);
    }

    public ResRoom getRoomWithRealtimeState(Long roomId) {
        var room = roomRepository.findByIdAndIsActiveTrue(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: ", roomId));

        // Ensure realtime state exists
        RoomRealtimeState state = roomStateManager.getRoomState(roomId);
        if (state == null) {
            roomStateManager.getOrCreateState(roomId, room.getHost().getId());
        }

        return this.toRes(room);
    }

    public boolean verifyPassword(Long roomId, String password) {
        return roomRepository.findById(roomId)
                .map(room -> {
                    // Public rooms don't need password
                    if (room.getIsPublic()) {
                        return true;
                    }

                    // Private rooms need password match
                    return room.getPassword() != null &&
                            this.passwordEncoder.matches(password, room.getPassword());
                })
                .orElse(false);
    }

    public void deleteRoom(Long id) {
        if (this.roomRepository.existsById(id)) {
            this.roomRepository.deleteById(id);
        }
    }
}