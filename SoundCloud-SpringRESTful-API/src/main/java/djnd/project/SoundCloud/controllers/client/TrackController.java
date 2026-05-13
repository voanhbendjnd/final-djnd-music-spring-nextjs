package djnd.project.SoundCloud.controllers.client;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.turkraft.springfilter.boot.Filter;

import jakarta.validation.Valid;
import djnd.project.SoundCloud.domain.entity.Comment;
import djnd.project.SoundCloud.domain.entity.Track;
import djnd.project.SoundCloud.domain.request.TrackDTO;
import djnd.project.SoundCloud.services.CommentService;
import djnd.project.SoundCloud.services.TrackService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import djnd.project.SoundCloud.utils.error.PermissionException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/tracks")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class TrackController {
    TrackService trackService;
    CommentService commentService;

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getMyTrackUploaded(@Filter Specification<Track> spec, Pageable pageable,
            @PathVariable("id") String userIdStr) {
        try {
            Long userId = Long.parseLong(userIdStr);
            return ResponseEntity.ok(this.trackService.getMyTrackUploaded(spec, pageable, userId));

        } catch (NumberFormatException ne) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("ID must be number!");
        }
    }

    @PostMapping("/upload-temp")
    public ResponseEntity<?> uploadTemp(@RequestPart("track") MultipartFile track)
            throws URISyntaxException, IOException {
        return ResponseEntity.ok(this.trackService.uploadTempTrack(track));
    }

    @PostMapping
    public ResponseEntity<?> createTrackByUser(@Valid @ModelAttribute TrackDTO dto,
            @RequestPart(value = "img", required = false) MultipartFile img,
            @RequestParam(value = "trackUrl", required = false) String trackFileName)
            throws URISyntaxException, Exception, PermissionException {
        this.trackService.createByUser(dto, img, trackFileName);
        return ResponseEntity.status(HttpStatus.CREATED).body("Create new track success");
    }

    @PostMapping("/admin")
    public ResponseEntity<?> createTrackByAdmin(@Valid @ModelAttribute TrackDTO dto,
            @RequestPart(value = "img", required = false) MultipartFile img,
            @RequestParam(value = "trackUrl", required = false) MultipartFile trackUrl)
            throws URISyntaxException, IOException, PermissionException {
        this.trackService.createTrackByAdmin(dto, img, trackUrl);
        return ResponseEntity.status(HttpStatus.CREATED).body("Create new track success");
    }

    @PutMapping

    public ResponseEntity<?> update(@Valid @ModelAttribute TrackDTO dto,
            @RequestPart(value = "img", required = false) MultipartFile img,
            @RequestPart(value = "track", required = false) MultipartFile track)
            throws URISyntaxException, IOException, PermissionException {
        this.trackService.update(dto, img, track);
        return ResponseEntity.ok("Update track success");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id) throws IOException {
        this.trackService.delete(id);
        return ResponseEntity.ok("Delete track success");
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> fetchById(@PathVariable("id") String strId) {
        try {
            Long id = Long.parseLong(strId);
            if (id <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Track ID must be positive!");
            }
            return ResponseEntity.ok(this.trackService.fetchById(id));

        } catch (NumberFormatException ne) {
            return ResponseEntity.status(HttpStatusCode.valueOf(400)).body("Track ID must be number!");
        }
    }

    @GetMapping("/{id}/isLiked")
    @ApiMessage("User must be login for like track and comment")
    public ResponseEntity<?> checkIsLikedWhenLogin(@PathVariable("id") String strId) throws PermissionException {
        try {
            Long id = Long.parseLong(strId);
            if (id <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Track ID must be positive!");
            }
            return ResponseEntity.ok(this.trackService.isLikedWhenLogin(id));

        } catch (NumberFormatException ne) {
            return ResponseEntity.status(HttpStatusCode.valueOf(400)).body("Track ID must be number!");
        }
    }

    @GetMapping
    public ResponseEntity<?> fetchAllWithPagination(@Filter Specification<Track> spec, Pageable pageable,
            @RequestParam(value = "category", required = false) String category) {
        return ResponseEntity.ok(this.trackService.fetchAllWithPagination(spec, pageable, category, null, null));
    }

    @GetMapping("/comments")
    @ApiMessage("Fetch All Comment By Track ID")
    public ResponseEntity<?> getAllCommentByTrackID(@Filter Specification<Comment> spec, Pageable pageable,
            @RequestParam(value = "trackId", required = false) String trackIdStr) {
        Long trackId = null;
        if (trackIdStr != null) {
            try {
                trackId = Long.parseLong(trackIdStr);
                if (trackId <= 0) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Track ID must be positive!");

                }

            } catch (NumberFormatException ne) {
                return ResponseEntity.badRequest().body("Track ID not number!");
            }
        }
        return ResponseEntity.ok(this.commentService.fetchAllWithPaginationDTO(spec, pageable, trackId));

    }

    @GetMapping("/uploader")
    @ApiMessage("Get avatar uploader")
    public ResponseEntity<?> getUploader(@RequestParam("trackId") String strTrackId,
            @RequestParam("trackUrl") String trackUrl, @RequestParam("lastId") String strLastId) {
        try {
            Long trackId = Long.parseLong(strTrackId);
            Long lastId = Long.parseLong(strLastId);
            if (trackId <= 0 || lastId <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Track ID must be positive!");

            }
            return ResponseEntity.ok(this.trackService.getUploader(trackId, lastId, trackUrl));

        } catch (NumberFormatException ne) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ne.getMessage());

        }
    }

    @PostMapping("/likes")
    @ApiMessage("Hanlde count likes track")
    public ResponseEntity<?> handleCountLikesTrack(@RequestBody Map<String, Long> request)
            throws PermissionException {
        var trackId = request.get("trackId");
        if (trackId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Track ID invalid");

        }
        if (trackId <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Track ID must be positive!");

        }
        return ResponseEntity.status(HttpStatus.CREATED).body(this.trackService.handleCountLikeTrack(trackId));
    }

    @PatchMapping("/view/increase")
    @ApiMessage("Count play track")
    public ResponseEntity<?> increamentCountPlayTrack(@RequestBody Map<String, Long> mpRequest) {
        var trackId = mpRequest.get("trackId");
        this.trackService.increamentCountPlayTrackToRedis(trackId);
        return ResponseEntity.ok(null);
    }

    @GetMapping("/likes")
    @ApiMessage("Get track my like")
    public ResponseEntity<?> getMyLikeTrack(@Filter Specification<Track> spec, Pageable pageable)
            throws PermissionException {
        return ResponseEntity.ok(this.trackService.getMyLikeTrack(spec, pageable));
    }

    @GetMapping("/audio")
    @ApiMessage("Get url track by track Id")
    public ResponseEntity<?> getURlTrack(@RequestParam("trackId") String trackIdStr) {
        Long trackId = null;
        if (trackIdStr != null) {
            try {
                trackId = Long.parseLong(trackIdStr);
                if (trackId <= 0) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Track ID must be positive!");

                }

            } catch (NumberFormatException ne) {
                return ResponseEntity.badRequest().body("Track ID not number!");
            }
        }
        return ResponseEntity.ok(this.trackService.getTrackUrlById(trackId));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "excludeIds", required = false) List<Long> excludeIds,
            Pageable pageable) {
        return ResponseEntity.ok(this.trackService.getRecommendations(category, excludeIds, pageable));
    }

}
