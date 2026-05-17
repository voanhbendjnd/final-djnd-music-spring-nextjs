package djnd.project.SoundCloud.services;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import djnd.project.SoundCloud.domain.entity.Category;
import djnd.project.SoundCloud.domain.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import djnd.project.SoundCloud.domain.entity.Track;
import djnd.project.SoundCloud.domain.entity.TrackLike;
import djnd.project.SoundCloud.domain.request.TrackDTO;
import djnd.project.SoundCloud.domain.response.ResSearch;
import djnd.project.SoundCloud.domain.response.ResTrackLike;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.domain.response.SearchFallbackResponse;
import djnd.project.SoundCloud.domain.response.TrackResponse;
import djnd.project.SoundCloud.redis.services.CountPlayTrack;
import djnd.project.SoundCloud.repositories.CategoryRepository;
import djnd.project.SoundCloud.repositories.HistoryTrackRepository;
import djnd.project.SoundCloud.repositories.TrackLikeRepository;
import djnd.project.SoundCloud.repositories.TrackRepository;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.error.PermissionException;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
@Service
public class TrackService {
    final TrackRepository trackRepository;
    final CategoryRepository categoryRepository;
    final FileService fileService;
    final UserService userService;
    final TrackLikeRepository trackLikeRepository;
    final CountPlayTrack countPlayTrack;
    final JdbcTemplate jdbcTemplate;
    final WaveformService waveformService;
    final YouTubeService youtubeService;
    final HistoryTrackRepository historyTrackRepository;
    @Value("${djnd.soundcloud.location.folder.img}")
    private String imgFolder;
    @Value("${djnd.soundcloud.location.folder.temp}")
    private String tempFolder;
    @Value("${djnd.soundcloud.location.folder.audio}")
    private String audioFolder;

    /*
     * Save track audio before save infomation track!
     */
    public String uploadTempTrack(MultipartFile trackUrl) throws URISyntaxException, IOException {
        // return this.fileService.getFinalFileName(trackUrl, tempFolder);
        return this.fileService.uploadToTemp(trackUrl);
    }

    private Track toTrack(TrackDTO dto) {
        var track = new Track();
        var category = this.categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category ID", "#" + dto.getCategoryId()));
        track.setCategory(category);
        track.setDescription(dto.getDescription());
        track.setTitle(dto.getTitle());
        return track;
    }

    public void createTrackByAdmin(TrackDTO dto, MultipartFile imgUrl, MultipartFile trackUrl)
            throws URISyntaxException, IOException, PermissionException {
        var track = this.toTrack(dto);
        var user = this.userService.getUserLoggedOrThrow();
        track.setUser(user);
        var imgUploadResult = this.fileService.uploadToCloudinary(imgUrl, imgFolder);
        track.setImgUrl(imgUploadResult.getSecureUrl());
        track.setImgPublicId(imgUploadResult.getPublicId());
        var audioUploadResult = this.fileService.uploadToCloudinary(trackUrl, audioFolder);
        track.setTrackUrl(audioUploadResult.getSecureUrl());
        track.setTrackPublicId(audioUploadResult.getPublicId());
        this.trackRepository.save(track);
        this.waveformService.generatePeaksForTrack(track.getId());
    }

    public void createByUser(TrackDTO dto, MultipartFile imgUrl, String trackFileName)
            throws URISyntaxException, Exception, PermissionException {
        var track = this.toTrack(dto);
        var user = this.userService.getUserLoggedOrThrow();
        track.setUser(user);
        var imgUploadResult = this.fileService.uploadToCloudinary(imgUrl, imgFolder);
        track.setImgUrl(imgUploadResult.getSecureUrl());
        track.setImgPublicId(imgUploadResult.getPublicId());
        String cloudinaryUrl = this.fileService.moveCloudinaryFile(trackFileName, audioFolder);
        String newPublicId = audioFolder + "/" + trackFileName.substring(trackFileName.lastIndexOf("/") + 1);
        track.setTrackUrl(cloudinaryUrl);
        track.setTrackPublicId(newPublicId);

        this.trackRepository.save(track);

        // Generate peaks asynchronously
        this.waveformService.generatePeaksForTrack(track.getId());
    }

    public void update(TrackDTO dto, MultipartFile imgUrl, MultipartFile trackUrl)
            throws URISyntaxException, IOException, PermissionException {
        var track = this.trackRepository.findById(dto.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Track ID", "#" + dto.getId()));

        var category = this.categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category ID", "#" + dto.getCategoryId()));
        track.setCategory(category);
        track.setDescription(dto.getDescription());
        track.setTitle(dto.getTitle());

        if (imgUrl != null && !imgUrl.isEmpty()) {
            var imgUploadResult = this.fileService.uploadToCloudinary(imgUrl, imgFolder);
            track.setImgUrl(imgUploadResult.getSecureUrl());
            track.setImgPublicId(imgUploadResult.getPublicId());
        }
        if (trackUrl != null && !trackUrl.isEmpty()) {
            var audioUploadResult = this.fileService.uploadToCloudinary(trackUrl, audioFolder);
            track.setTrackUrl(audioUploadResult.getSecureUrl());
            track.setTrackPublicId(audioUploadResult.getPublicId());
        }

        this.trackRepository.save(track);
    }

    public void delete(Long id) throws IOException {
        var track = this.trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track ID", "#" + id));

        if (track.getImgPublicId() != null) {
            this.fileService.deleteCloudinaryFile(track.getImgPublicId(), "image");
        }
        if (track.getTrackPublicId() != null) {
            this.fileService.deleteCloudinaryFile(track.getTrackPublicId(), "video");
        }

        this.trackRepository.delete(track);
    }

    public TrackResponse fetchById(Long id) {
        var track = this.trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track ID", "#" + id));
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        var res = convertToResponse(track);
        if (userId != null) {
            res.setIsLiked(this.trackLikeRepository.existsByUserIdAndTrackId(userId, id));
        }
        return res;

    }

    public boolean isLikedWhenLogin(Long id) throws PermissionException {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if (userId != null) {
            return this.trackLikeRepository.existsByUserIdAndTrackId(userId, id);
        }
        throw new PermissionException("You do not have permission!");
    }

    public SearchFallbackResponse<?> fetchAllWithPagination(Specification<Track> spec, Pageable pageable,
            String category,
            String qStr, String pageToken) {
        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        if (category != null && !category.isEmpty()) {
            spec = spec.and((root, query, cb) -> {
                Join<Track, Category> joinCategory = root.join("category", JoinType.LEFT);
                return cb.equal(joinCategory.get("name"), category);
            });
        }
        if (qStr != null && !qStr.isBlank()) {
            spec = spec.and((root, query, cb) -> {
                query.distinct(true);
                String searchPattern = "%" + qStr.toLowerCase() + "%";
                Predicate titlePredicate = cb.like(cb.lower(root.get("title")), searchPattern);
                Join<Track, User> userJoin = root.join("user", JoinType.LEFT);
                Predicate userPredicate = cb.like(cb.lower(userJoin.get("name")), searchPattern);

                return cb.or(titlePredicate, userPredicate);
            });
        }
        var page = this.trackRepository.findAll(spec, pageable);
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(page.getTotalPages());
        meta.setTotal(page.getTotalElements());
        res.setMeta(meta);
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        var finalData = page.getContent().stream()
                .map(x -> convertToResponse(x))
                .toList();
        if (userId != null) {
            var trackIds = finalData.stream().map(x -> x.getId()).toList();
            var likeTrackIdsSet = this.trackLikeRepository.getIdTracksByUserId(userId, trackIds).stream()
                    .collect(Collectors.toSet());
            finalData.forEach(x -> x.setIsLiked(likeTrackIdsSet.contains(x.getId())));
        }
        res.setResult(finalData);

        if (res.getResult() == null || ((List<?>) res.getResult()).isEmpty()) {
            if (qStr != null && !qStr.isBlank()) {
                var youtubeResponse = this.youtubeService.searchVideos(qStr, pageToken);
                if (youtubeResponse.getResult() == null || youtubeResponse.getResult().isEmpty()) {
                    return new SearchFallbackResponse<>("empty", new ArrayList<>());
                }
                return new SearchFallbackResponse<>("youtube", List.of(youtubeResponse));
            }
        }

        return new SearchFallbackResponse<>("local", List.of(res));
    }

    protected TrackResponse convertToResponse(Track x) {
        var result = new TrackResponse();
        result.setCategory(x.getCategory().getName());
        result.setCountLike(x.getCountLike());
        result.setCountPlay(x.getCountPlay());
        result.setCreatedAt(x.getCreatedAt());
        result.setDescription(x.getDescription());
        result.setId(x.getId());
        result.setImgUrl(x.getImgUrl());
        result.setTitle(x.getTitle());
        result.setTrackUrl(x.getTrackUrl());
        result.setUpdatedAt(x.getUpdatedAt());
        result.setPeaks(x.getPeaks());
        result.setWaveformUrl(x.getWaveformUrl());
        var user = x.getUser();
        var uploader = new TrackResponse.Uploader();
        // uploader.setEmail(user.getEmail());
        uploader.setId(user.getId());
        uploader.setName(user.getName());
        if (user.getAvatar() != null) {
            uploader.setAvatar(user.getAvatar());
        }
        // if (user.getRole() != null) {
        // uploader.setRole(user.getRole().getName());
        // }
        result.setUploader(uploader);
        return result;
    }

    public ResultPaginationDTO getMyTrackUploaded(Specification<Track> spec, Pageable pageable, Long userId) {
        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        Specification<Track> ps = (r, q, c) -> {
            Join<Track, User> joinUser = r.join("user");
            return c.equal(joinUser.get("id"), userId);
        };
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        Page<Track> page = this.trackRepository.findAll(spec.and(ps), pageable);
        meta.setPages(page.getTotalPages());
        meta.setTotal(page.getTotalElements());
        res.setMeta(meta);
        var userLoginId = SecurityUtils.getCurrentUserIdOrNull();
        var finalData = page.getContent().stream().map(this::convertToResponse).toList();
        if (userLoginId != null) {
            var trackIds = finalData.stream().map(x -> x.getId()).toList();
            var idsTrackLiked = this.trackLikeRepository.getIdTracksByUserId(userLoginId, trackIds);
            finalData.forEach(x -> x.setIsLiked(idsTrackLiked.contains(x.getId())));
        }
        res.setResult(finalData);
        return res;
    }

    public Track getTrackOrThrow(Long id) {
        var track = this.trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track ID", "" + id));
        return track;
    }

    @Transactional
    public ResTrackLike handleCountLikeTrack(Long trackId) throws PermissionException {
        var user = this.userService.getUserLoggedOrThrow();

        boolean isCurrentlyLiked = this.trackLikeRepository.existsByUserIdAndTrackId(user.getId(), trackId);

        if (!isCurrentlyLiked) {
            TrackLike trackLike = new TrackLike();
            trackLike.setTrack(this.trackRepository.getReferenceById(trackId));
            trackLike.setUser(user);

            this.trackLikeRepository.save(trackLike);
            this.trackRepository.increamentCountLikes(trackId);
        } else {
            this.trackLikeRepository.deleteByUserIdAndTrackId(user.getId(), trackId);
            this.trackRepository.decreamentCountLikes(trackId);
        }

        var res = new ResTrackLike();
        res.setCountLikes(this.trackRepository.getCountLike(trackId));
        res.setIsLiked(!isCurrentlyLiked);

        return res;
    }

    public void increamentCountPlayTrackToRedis(Long trackId) {
        this.countPlayTrack.saveViewToRedis(trackId);
    }

    /*
     * fixedRate = 600000 after 10 minutes run
     */
    @Scheduled(fixedRate = 600000)
    public void increamentCountPlayTrack() {
        var viewMaps = this.countPlayTrack.getTrackIdAndCountView();
        if (viewMaps == null)
            return;
        List<Object[]> batchArgs = new ArrayList<>();
        for (Map.Entry<Object, Object> entry : viewMaps.entrySet()) {
            Long trackId = Long.valueOf(entry.getKey().toString());
            Long increasementViews = Long.valueOf(entry.getValue().toString());
            batchArgs.add(new Object[] { trackId, increasementViews });
        }
        String query = "insert into tracks (id, count_play) values (?, ?) ON DUPLICATE KEY UPDATE count_play = count_play + VALUES(count_play)";
        jdbcTemplate.batchUpdate(query, batchArgs);
        this.countPlayTrack.deleteCountViewTrack();
    }

    public ResultPaginationDTO getMyLikeTrack(Specification<Track> spec, Pageable pageable) throws PermissionException {
        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        var user = this.userService.getUserLoggedOrThrow();
        var myTracks = this.trackLikeRepository.getMyLikeTrackNative(user.getId(), pageable);

        int requestedPage = pageable.getPageNumber() + 1;
        int totalPages = myTracks.getTotalPages();

        // Validate page bounds
        if (requestedPage > totalPages && totalPages > 0) {
            meta.setPage(requestedPage);
            meta.setPageSize(pageable.getPageSize());
            meta.setPages(totalPages);
            meta.setTotal(myTracks.getTotalElements());
            res.setMeta(meta);
            res.setResult(Collections.emptyList());
            return res;
        }

        // Specification<Track> sp = (r, q, c) -> {
        // Join<Track, TrackLike> joinTrackLike = r.join("trackLike");
        // return c.equal(joinTrackLike.get("user").get("id"), user.getId());
        // };
        meta.setPage(requestedPage);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(totalPages);
        meta.setTotal(myTracks.getTotalElements());
        res.setMeta(meta);
        // var userId = SecurityUtils.getCurrentUserIdOrNull();
        var resMyTracks = myTracks.getContent().stream().map(x -> convertToResponse(x)).toList();
        resMyTracks.forEach(x -> x.setIsLiked(true));
        // var itrackIds = this.trackLikeRepository.findLikedTrackIds(user.getId(),
        // resMyTracks.stream().map(x -> x.getId()).toList());
        res.setResult(resMyTracks);
        return res;
    }

    public TrackResponse getUploader(Long trackId, Long lastId, String trackUrl) {
        if (!this.checkIdAndAudioFile(trackId, lastId, trackUrl)) {
            throw new ResourceNotFoundException("Track ID", trackId);
        }
        var uploaderTrackUrl = this.trackRepository.getUploader(lastId);
        var res = new TrackResponse();
        var uploader = new TrackResponse.Uploader();
        uploader.setAvatar(uploaderTrackUrl.getAvatar());
        uploader.setName(uploaderTrackUrl.getName());
        uploader.setId(uploaderTrackUrl.getId());
        res.setUploader(uploader);
        return res;
    }

    public boolean checkIdAndAudioFile(Long trackId, Long trackIdLast, String trackUrl) {
        if (!this.trackRepository.existsByTrackUrlAndId("https://res.cloudinary.com/dddppjhly/video/upload" + trackUrl,
                trackId) || !trackIdLast.equals(trackId)) {
            return false;
        }
        return true;
    }

    public String getTrackUrlById(Long trackId) {
        if (!this.trackRepository.existsById(trackId)) {
            throw new ResourceNotFoundException("Track audio url", trackId);
        }
        return this.trackRepository.getUrlTrackById(trackId);

    }

    public SearchFallbackResponse<?> search(String key) {
        Pageable pageable = PageRequest.of(0, 9);
        var localResults = this.trackRepository.searchByKey(key, pageable).stream().map(x -> {
            var res = new ResSearch();
            res.setId(x.getId());
            res.setImgUrl(x.getImgUrl());
            res.setName(x.getName());
            res.setTitle(x.getTitle());
            res.setTrackUrl(x.getTrackUrl());
            return res;
        }).toList();

        if (localResults.isEmpty()) {
            var youtubeResponse = this.youtubeService.searchVideos(key, null);
            if (youtubeResponse.getResult() == null || youtubeResponse.getResult().isEmpty()) {
                return new SearchFallbackResponse<>("empty", new ArrayList<>());
            }
            return new SearchFallbackResponse<>("youtube", List.of(youtubeResponse));
        }

        return new SearchFallbackResponse<>("local", localResults);
    }

    public ResultPaginationDTO getRecommendations(String category, List<Long> excludeIds, Pageable pageable) {
        if (excludeIds == null)
            excludeIds = List.of(-1L);
        else if (excludeIds.isEmpty())
            excludeIds.add(-1L);

        Page<Track> page = this.trackRepository.findByByCategoryAndIdNotIn(category, excludeIds, pageable);

        if (page.getContent().isEmpty()) {
            page = this.trackRepository.findAllByIdNotIn(excludeIds, pageable);
        }

        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(page.getTotalPages());
        meta.setTotal(page.getTotalElements());
        res.setMeta(meta);

        var finalData = page.getContent().stream().map(this::convertToResponse).toList();
        res.setResult(finalData);
        return res;
    }

    public TrackResponse getTrackRandomForPlayer() throws BadRequestException {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        var recentTrackIds = this.historyTrackRepository.getTop10IdsTrackHistoryListening(userId,
                PageRequest.of(0, 10));
        if (recentTrackIds == null || recentTrackIds.isEmpty()) {
            recentTrackIds.add(0L);
        }
        var track = this.trackRepository.getTrackRamdom(recentTrackIds, PageRequest.of(0, 1)).getFirst();
        if (track == null) {
            throw new BadRequestException("Not track!");
        }
        return this.convertToResponse(track);

    }

}
