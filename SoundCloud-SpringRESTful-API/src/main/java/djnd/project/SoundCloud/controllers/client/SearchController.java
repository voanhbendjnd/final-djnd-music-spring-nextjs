package djnd.project.SoundCloud.controllers.client;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.turkraft.springfilter.boot.Filter;

import djnd.project.SoundCloud.domain.entity.Track;
import djnd.project.SoundCloud.services.TrackService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/search")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class SearchController {
    TrackService trackService;

    @GetMapping("/suggestions")
    @ApiMessage("Search title or uploader by query")
    public ResponseEntity<?> searchByKey(@RequestParam(value = "q", required = false) String q) {
        return ResponseEntity.ok(this.trackService.search(q));
    }

    @GetMapping
    @ApiMessage("Fetch data search by query")
    public ResponseEntity<?> getDataSearch(@Filter Specification<Track> spec, Pageable pageable,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "pageToken", required = false) String pageToken) {
        return ResponseEntity.ok(this.trackService.fetchAllWithPagination(spec, pageable, null, q, pageToken));
    }

}
