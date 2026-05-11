package djnd.project.SoundCloud.domain.entity;

import java.util.List;

import org.hibernate.annotations.BatchSize;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "playlists")
@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
public class Playlist extends BaseEntity {
    String title;
    String imgUrl;
    @Column(columnDefinition = "MEDIUMTEXT")
    String description;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;
    // get all playlist_track where playlist id in (1,2,3,...)
    @OneToMany(mappedBy = "playlist", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    List<PlaylistTrack> playlistTracks;
    Integer totalTracks = 0;
    Boolean isPublic;

}
