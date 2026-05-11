package djnd.project.SoundCloud.services;

import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import djnd.project.SoundCloud.domain.entity.Playlist;
import djnd.project.SoundCloud.domain.entity.PlaylistTrack;
import djnd.project.SoundCloud.domain.it.PlaylistKey;
import djnd.project.SoundCloud.domain.request.AddTrackToPlaylistDTO;
import djnd.project.SoundCloud.domain.request.PlaylistDTO;
import djnd.project.SoundCloud.domain.response.ResAddToPlaylist;
import djnd.project.SoundCloud.domain.response.ResAllPlaylist;
import djnd.project.SoundCloud.domain.response.ResPlaylist;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.repositories.PlaylistRepository;
import djnd.project.SoundCloud.repositories.PlaylistTrackRepository;
import djnd.project.SoundCloud.repositories.TrackRepository;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.error.PermissionException;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class PlayListService {
    final PlaylistRepository playlistRepository;
    final UserService userService;
    final TrackRepository trackRepository;
    final PlaylistTrackRepository playlistTrackRepository;
    final FileService fileService;
    @Value("${djnd.soundcloud.location.folder.img}")
    private String imgFolder;

    public ResPlaylist createNewPlaylist(PlaylistDTO dto) throws PermissionException {
        var playlist = new Playlist();
        var currentUserLogin = this.userService.getUserLoggedOrThrow();
        playlist.setIsPublic(dto.getIsPublic());
        playlist.setTitle(dto.getTitle());
        playlist.setUser(currentUserLogin);

        if (dto.getTrackIds() != null && !dto.getTrackIds().isEmpty()) {
            var tracks = this.trackRepository.findByIdIn(dto.getTrackIds());
            if (!tracks.isEmpty()) {
                playlist.setPlaylistTracks(tracks.stream().map(x -> {
                    var playlistTrack = new PlaylistTrack();
                    playlistTrack.setPlaylist(playlist);
                    playlistTrack.setTrack(x);
                    playlistTrack.setIsAdded(true);
                    return playlistTrack;
                }).toList());
                // playlist.setImgUrl(tracks.getFirst().getImgUrl());
                playlist.setTotalTracks(tracks.size());
            }
        }
        var savePlaylist = this.playlistRepository.save(playlist);

        return this.toResPlaylist(this.playlistRepository.findWithDetailsById(savePlaylist.getId()).get());
    }

    @Transactional
    public ResAddToPlaylist handleOnClickTrackToPlaylist(AddTrackToPlaylistDTO dto, Long trackId) {
        var playlist = this.playlistRepository.findWithDetailsById(dto.getPlaylistId())
                .orElseThrow(() -> new ResourceNotFoundException("Playlist ID", dto.getPlaylistId()));
        boolean existsTrackInPlaylist = this.playlistTrackRepository.existsByPlaylistIdAndTrackId(dto.getPlaylistId(),
                trackId);

        if (dto.getIsAdded() && !existsTrackInPlaylist) {
            var trackProxy = this.trackRepository.getReferenceById(trackId);
            var playlistTrack = new PlaylistTrack();
            playlistTrack.setPlaylist(playlist);
            playlistTrack.setTrack(trackProxy);
            playlistTrack.setIsAdded(dto.getIsAdded());
            this.playlistTrackRepository.save(playlistTrack);
            this.playlistRepository.incremementTrackInPlaylist(playlist.getId(), 1);
            var currentTotalTracks = (playlist.getTotalTracks() != null ? playlist.getTotalTracks() : 0) + 1;
            playlist.setTotalTracks(currentTotalTracks);
            return this.toResAddToPlaylist(playlist.getId(), existsTrackInPlaylist, currentTotalTracks);
        }
        if (!dto.getIsAdded()) {
            var playlistTrackDB = this.playlistTrackRepository.findByPlaylistIdAndTrackId(dto.getPlaylistId(),
                    trackId);
            if (playlistTrackDB != null) {
                this.playlistRepository.decremementTrackInPlaylist(playlist.getId(), 1);
                this.playlistTrackRepository.deleteByPlaylistIdAndTrackId(playlist.getId(), trackId);
                var currentTotalTracks = (playlist.getTotalTracks() != null ? playlist.getTotalTracks() : 0) - 1;
                if (currentTotalTracks < 0) {
                    throw new DataAccessResourceFailureException("Data Access Resource Failure!");
                }
                playlist.setTotalTracks(currentTotalTracks);

                return this.toResAddToPlaylist(playlist.getId(), existsTrackInPlaylist, currentTotalTracks);
            }
        }

        throw new ResourceNotFoundException("Action invalid", "nil");
    }

    private ResAddToPlaylist toResAddToPlaylist(Long playlistId, boolean isAdded, int total) {
        var res = new ResAddToPlaylist();
        res.setId(playlistId);
        res.setIsAdded(!isAdded);
        res.setTotalTracks(total);
        return res;
    }

    public List<ResAllPlaylist> getAllPlaylistAccount() throws PermissionException {
        Long userId = SecurityUtils.getCurrentUserIdOrNull();
        if (userId != null) {
            return this.playlistRepository.getAllPlaylistExistsByUserId(userId).stream()
                    .collect(Collectors.groupingBy(
                            x -> new PlaylistKey(x.getId(), x.getTitle(), x.getImgUrl(), x.getIsPublic()),
                            Collectors.mapping(x -> x.getTrackId(), Collectors.toList())))
                    .entrySet().stream().map(entry -> {
                        var trackIds = entry.getValue().stream().filter(Objects::nonNull).toList();
                        return new ResAllPlaylist(entry.getKey().id(), entry.getKey().title(), trackIds.size(),
                                trackIds, entry.getKey().imgUrl(), entry.getKey().isPublic());
                    }).toList();
        }
        throw new PermissionException("You do not have permission!");

    }

    public ResultPaginationDTO getAllPlaylistWithPagination(Specification<Playlist> spec, Pageable pageable,

            String title) throws PermissionException {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if (userId == null) {
            throw new PermissionException("You do not have access!");
        }
        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        // if (title != null && !title.isEmpty()) {
        // Specification<Playlist> ps = (r, q, c) -> {
        // String key = "%" + title.toLowerCase() + "%";
        // Predicate titlePredicate = c.like(c.lower(r.get("title")), key);
        // Join<Playlist, User> userJoin = r.join("user", JoinType.LEFT);
        // var userPredicate = c.equal(userJoin.get("id"), userId);
        // return c.and(userPredicate, titlePredicate);
        // };
        // spec = spec.and(ps);
        // }

        var page = this.playlistRepository.findAllPlaylistNative(userId, title, pageable);
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(page.getTotalPages());
        meta.setTotal(page.getTotalElements());
        res.setMeta(meta);
        res.setResult(page.getContent());
        return res;

    }

    public ResPlaylist getPlaylistDetail(Long playlistId) {
        var playlist = this.playlistRepository.findWithDetailsById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist ID", playlistId));
        if (!playlist.getIsPublic()) {
            var userId = SecurityUtils.getCurrentUserIdOrNull();
            if (userId != null && userId.equals(playlist.getUser().getId())) {
                return this.toResPlaylist(playlist);
            }
            throw new ResourceNotFoundException("Playlist", playlistId);
        } else {
            return this.toResPlaylist(playlist);
        }
    }

    public ResPlaylist getPlaylistDetailPublic(Long playlistId) {
        var playlist = this.playlistRepository.findWithDetailsById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist ID", playlistId));
        return this.toResPlaylist(playlist);
    }

    public ResPlaylist toResPlaylist(Playlist playlist) {
        var res = new ResPlaylist();
        res.setCreatedAt(playlist.getCreatedAt());
        res.setCreatedBy(playlist.getCreatedBy());
        res.setDescription(playlist.getDescription());
        res.setId(playlist.getId());
        if (playlist.getImgUrl() != null || playlist.getTotalTracks() > 0) {
            var img = playlist.getImgUrl() != null ? playlist.getImgUrl()
                    : playlist.getPlaylistTracks().getFirst().getTrack().getImgUrl();
            playlist.setImgUrl(img);
        }
        res.setIsPublic(playlist.getIsPublic());
        res.setTitle(playlist.getTitle());
        res.setTotalTracks(playlist.getTotalTracks());
        res.setUpdatedAt(playlist.getUpdatedAt());
        res.setUpdatedBy(playlist.getUpdatedBy());
        var userPlaylist = new ResPlaylist.User();
        var user = playlist.getUser();
        userPlaylist.setAvatar(user.getAvatar());
        userPlaylist.setId(user.getId());
        userPlaylist.setName(user.getName());
        userPlaylist.setRole(user.getRole().getName());
        res.setUser(userPlaylist);
        if (playlist.getPlaylistTracks() != null) {
            var playlistTracks = playlist.getPlaylistTracks().stream().map(x -> {
                var resPlaylistTrack = new ResPlaylist.ResPlaylistTrack();
                var track = x.getTrack();
                resPlaylistTrack.setId(track.getId());
                resPlaylistTrack.setCountLikes(track.getCountLike());
                resPlaylistTrack.setCountPlays(track.getCountPlay());
                resPlaylistTrack.setImgUrl(track.getImgUrl());
                resPlaylistTrack.setTitle(track.getTitle());
                resPlaylistTrack.setTrackUrl(track.getTrackUrl());
                var uploader = track.getUser();
                var resUploader = new ResPlaylist.ResPlaylistTrack.Uploader();
                resUploader.setAvatar(uploader.getAvatar());
                resUploader.setId(uploader.getId());
                resUploader.setName(uploader.getName());
                resPlaylistTrack.setUploader(resUploader);
                return resPlaylistTrack;
            }).toList();
            res.setPlaylistTracks(playlistTracks);
            res.setTotalTracks(playlistTracks.size());

        }

        return res;
    }

    public ResPlaylist updatePlaylist(PlaylistDTO dto, MultipartFile imgUrl) throws IOException {
        var playlist = playlistRepository.findById(dto.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playlist ID", dto.getId()));
        if (imgUrl != null) {
            var resSaveImg = this.fileService.uploadToCloudinary(imgUrl, imgFolder);
            playlist.setImgUrl(resSaveImg.getSecureUrl());
        }
        playlist.setTitle(dto.getTitle());
        playlist.setDescription(dto.getDescription());
        playlist.setIsPublic(dto.getIsPublic());
        return this.toResPlaylist(this.playlistRepository.save(playlist));
    }
}
