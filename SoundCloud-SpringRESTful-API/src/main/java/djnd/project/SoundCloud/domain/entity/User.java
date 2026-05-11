package djnd.project.SoundCloud.domain.entity;

import java.util.Date;
import java.util.List;

import org.hibernate.annotations.BatchSize;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@BatchSize(size = 20)
public class User extends BaseEntity {
    String name;
    String email;
    String password;
    // GITHUB, GOOGLE
    String type;
    @Column(name = "session_id")
    String sessionId;
    @ManyToOne
    @JoinColumn(name = "role_id")
    Role role;
    @Column(columnDefinition = "MEDIUMTEXT")
    String refreshToken;
    @Column(columnDefinition = "MEDIUMTEXT")
    String previousRefreshToken;
    @Column(name = "last_refresh_time")
    Date lastRefreshTime;
    @Column(name = "one_time_password")
    String oneTimePassword;
    @Column(name = "otp_request_time")
    Date otpRequestedTime;
    static final long OTP_VALID_DURATION = 5 * 60 * 1000; // 5 minutes
    boolean accept;
    String avatar;
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Track> tracks;
    Boolean status = true;
    String username;
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Comment> comments;
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<CommentLike> commentLikes;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<TrackLike> trackLikes;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Playlist> playlists;
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<HistoryTrack> historyTracks;

    public boolean isOTPRequired() {
        if (this.getOneTimePassword() == null) {
            return false;
        }
        var currentTimeInMillis = System.currentTimeMillis();
        var otpTime = this.otpRequestedTime.getTime();
        if (otpTime + OTP_VALID_DURATION < currentTimeInMillis) {
            return false;
        }
        return true;
    }

}
