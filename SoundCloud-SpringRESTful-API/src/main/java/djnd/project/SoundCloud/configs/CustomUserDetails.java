package djnd.project.SoundCloud.configs;

import java.util.Collection;
import java.util.HashSet;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import djnd.project.SoundCloud.domain.entity.User;

public record CustomUserDetails(User user) implements UserDetails {
    /*
     * ROLE_ for check @Pre hasRole('ADMIN')
     * authorize permission for check UPLOAD_SONG,...
     * return for auth.getAuthorities()
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        var permissions = user.getRole().getPermissions();
        var authSet = new HashSet<SimpleGrantedAuthority>();
        String roleName = user.getRole().getName() != null ? user.getRole().getName().toUpperCase() : "USER_NORMAL";
        authSet.add(new SimpleGrantedAuthority("ROLE_" + roleName));
        for (var x : permissions) {
            authSet.add(new SimpleGrantedAuthority(x.getName()));
        }
        return authSet;
    }

    public Long getId() {
        return user.getId();
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }
}
