package djnd.project.SoundCloud.controllers;

import djnd.project.SoundCloud.domain.entity.ListeningRoom;
import djnd.project.SoundCloud.domain.realtime.RoomRealtimeState;
import djnd.project.SoundCloud.domain.request.RoomDTO;
import djnd.project.SoundCloud.services.RoomService;
import djnd.project.SoundCloud.services.realtime.RoomStateManager;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    public ResponseEntity<?> getRoom(@PathVariable Long id) {
        try {
            var room = roomService.getRoomWithRealtimeState(id);
            RoomRealtimeState state = roomStateManager.getRoomState(id);

            Map<String, Object> response = new HashMap<>();
            response.put("id", room.getId());
            response.put("name", room.getName());
            response.put("hostUserId", room.getHost().getId());
            response.put("hostUserName", room.getHost().getName());
            response.put("isPublic", room.getIsPublic());
            response.put("isActive", room.getIsActive());
            response.put("createdAt", room.getCreatedAt());

            // Add realtime state if available
            if (state != null) {
                response.put("realtimeState", state);
            }

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<?> listRooms(@RequestParam(required = false) String filter) {
        Long currentUserId = SecurityUtils.getCurrentUserIdOrNull();

        List<ListeningRoom> rooms;
        if ("my".equals(filter) && currentUserId != null) {
            rooms = roomService.findUserRooms(currentUserId);
        } else {
            rooms = roomService.fetchAll();
        }

        List<Map<String, Object>> response = rooms.stream().map(room -> {
            Map<String, Object> roomData = new HashMap<>();
            roomData.put("id", room.getId());
            roomData.put("name", room.getName());
            roomData.put("hostUserId", room.getHost().getId());
            roomData.put("hostUserName", room.getHost().getName());
            roomData.put("isPublic", room.getIsPublic());
            roomData.put("createdAt", room.getCreatedAt());

            // Add listener count from realtime state
            RoomRealtimeState state = roomStateManager.getRoomState(room.getId());
            roomData.put("listenerCount", state != null ? state.getConnectedUserIds().size() : 0);

            return roomData;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<?> verifyPassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String password = request.get("password");
        boolean isValid = roomService.verifyPassword(id, password);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoom(
            @PathVariable Long id,
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
    public ResponseEntity<?> deleteRoom(@PathVariable Long id) {
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