package djnd.project.SoundCloud.configs;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import djnd.project.SoundCloud.repositories.UserRepository;

@Component("userDetailsService")
public class UserDetailCustoms implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailCustoms(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        var user = this.userRepository.findWithDetailByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Username or Password incorrect!"));
        return new CustomUserDetails(user);
    }

}
