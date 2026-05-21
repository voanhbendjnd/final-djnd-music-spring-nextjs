package djnd.project.SoundCloud.controllers;

import djnd.project.SoundCloud.services.realtime.ChatRealtimeService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
public class ChatController {
    private final ChatRealtimeService chatRealtimeService;

    @GetMapping("/history")
    @ApiMessage("Get history for user")
    public ResponseEntity<?> getHistoryChat(@RequestParam("roomId") String roomIdStr) throws BadRequestException{
        try{
            long roomId = Long.parseLong(roomIdStr);
            if(roomId <= 0){
                throw new BadRequestException("Room ID must be positive number!");
            }
            return ResponseEntity.ok(this.chatRealtimeService.getHistoryChatForUserJoin(roomId));
        }
        catch(NumberFormatException ex){
            throw new BadRequestException("Room ID must be a number!");
        }
    }

}
