package djnd.project.SoundCloud.controllers.client;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.turkraft.springfilter.boot.Filter;

import djnd.project.SoundCloud.domain.entity.Track;
import djnd.project.SoundCloud.domain.request.HistoryDTO;
import djnd.project.SoundCloud.services.HistoryService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/histories")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class HistoryController {
    HistoryService historyService;

    @GetMapping
    @ApiMessage("get history user listened")
    public ResponseEntity<?> getTracksUserListened() {
        return ResponseEntity.ok(this.historyService.getHistoryTrackListened());
    }

    @PostMapping
    @ApiMessage("Save history lisened track for user")
    public ResponseEntity<?> saveHistory(@RequestBody List<HistoryDTO> historyDTO) {
        this.historyService.upsertBatchHistory(historyDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Save track to history success");
    }

    @GetMapping("/main")
    @ApiMessage("Get data for history page")
    public ResponseEntity<?> getDataForPage(@Filter Specification<Track> spec, Pageable pageable) {
        return ResponseEntity.ok(this.historyService.getAllForMainPageHistory(spec, pageable));
    }
}
