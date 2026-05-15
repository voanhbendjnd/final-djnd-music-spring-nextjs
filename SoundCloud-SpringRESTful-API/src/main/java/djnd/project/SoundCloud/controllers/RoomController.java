package djnd.project.SoundCloud.controllers;

import djnd.project.SoundCloud.domain.entity.ListeningRoom;
import djnd.project.SoundCloud.domain.realtime.RoomRealtimeState;
import djnd.project.SoundCloud.domain.request.RoomDTO;
import djnd.project.SoundCloud.services.RoomService;
import djnd.project.SoundCloud.services.realtime.RoomStateManager;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.turkraft.springfilter.boot.Filter;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final RoomStateManager roomStateManager;

    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody RoomDTO dto) {
        return ResponseEntity.ok(roomService.createRoom(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRoom(@PathVariable("id") Long id) {
        try {
            var room = roomService.getRoomWithRealtimeState(id);
            RoomRealtimeState state = roomStateManager.getRoomState(id);
            // Add realtime state if available
            if (state != null) {
                room.setRealtimeState(state);
            }

            return ResponseEntity.ok(room);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // @GetMapping
    // public ResponseEntity<?> listRooms(@RequestParam(value = "filter", required =
    // false) String filter) {
    // Long currentUserId = SecurityUtils.getCurrentUserIdOrNull();
    // List<ResRoom> rooms;
    // if ("my".equals(filter) && currentUserId != null) {
    // rooms = roomService.findUserRooms(currentUserId);
    // } else {
    // rooms = roomService.fetchAll();
    // }
    // return ResponseEntity.ok(rooms);
    // }

    @GetMapping
    public ResponseEntity<?> listRoomsWithPagination(@RequestParam(value = "key", required = false) String key,
            @Filter Specification<ListeningRoom> spec, Pageable pageable) {
        return ResponseEntity.ok(this.roomService.fetchAllWithPagination(spec, pageable, key));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<?> verifyPassword(@PathVariable("id") Long id, @RequestBody Map<String, String> request) {
        String password = request.get("password");
        boolean isValid = roomService.verifyPassword(id, password);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoom(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> request) {
        Long currentUserId = SecurityUtils.getCurrentUserIdOrNull();

        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            String name = (String) request.get("name");
            String description = (String) request.get("description");
            Boolean isPublic = (Boolean) request.get("isPublic");

            var room = roomService.updateRoom(id, name, description, isPublic, currentUserId);

            Map<String, Object> response = new HashMap<>();
            response.put("id", room.getId());
            response.put("name", room.getName());
            response.put("isPublic", room.getIsPublic());

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRoom(@PathVariable("id") Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserIdOrNull();

        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            roomService.deleteRoom(id, currentUserId);
            return ResponseEntity.ok(Map.of("message", "Room deleted successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}