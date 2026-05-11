package djnd.project.SoundCloud.services;

import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import djnd.project.SoundCloud.domain.entity.Track;
import djnd.project.SoundCloud.repositories.TrackRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WaveformService {

    private static final Logger log = LoggerFactory.getLogger(WaveformService.class);

    private final TrackRepository trackRepository;
    private final FileService fileService;
    @Value("${djnd.soundcloud.audiowaveform.path}")
    private String audiowaveformPath;

    @Async
    @Transactional
    public void generatePeaksForTrack(Long trackId) {
        try {
            Track track = trackRepository.findById(trackId)
                    .orElseThrow(() -> new RuntimeException("Track not found"));

            if (track.getPeaks() != null && !track.getPeaks().isEmpty()) {
                return;
            }

            Path tempAudio = download(track.getTrackUrl());

            List<Integer> peaks = generate(tempAudio);
            // var lastPeaks = convert(peaks);
            track.setWaveformUrl(this.fileService.uploadWaveformJson(peaks));
            // track.setPeaks(lastPeaks);
            trackRepository.save(track);

            Files.deleteIfExists(tempAudio);

        } catch (Exception e) {
            log.error("ERROR waveform", e);
        }
    }

    @SuppressWarnings("deprecation")
    private Path download(String urlStr) throws Exception {
        URL url = new URL(urlStr);
        Path file = Files.createTempFile("audio", ".mp3");

        try (var in = url.openStream()) {
            Files.copy(in, file, StandardCopyOption.REPLACE_EXISTING);
        }
        return file;
    }

    private List<Integer> generate(Path audio) throws Exception {
        Path json = audio.resolveSibling(audio.getFileName() + ".json");

        ProcessBuilder pb = new ProcessBuilder(
                audiowaveformPath,
                "-i", audio.toString(),
                "-o", json.toString(),
                "-b", "8",
                "--pixels-per-second", "80",
                "--quiet");

        Process p = pb.start();
        p.waitFor();

        String content = Files.readString(json);
        Files.deleteIfExists(json);

        return parseToInteger(content);
    }

    private List<Integer> parseToInteger(String json) throws Exception {

        ObjectMapper mapper = new ObjectMapper();

        JsonNode root = mapper.readTree(json);

        List<Integer> result = new ArrayList<>();

        for (JsonNode n : root.get("data")) {
            result.add(n.asInt());
        }

        return result;
    }

    private List<Double> parse(String json) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(json);

        List<Double> result = new ArrayList<>();
        for (JsonNode n : root.get("data")) {
            result.add(n.asDouble());
        }
        return result;
    }

    private String convert(List<Double> peaks) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < peaks.size(); i++) {
            double normalized = peaks.get(i) / 255.0;
            sb.append(normalized);
            if (i < peaks.size() - 1)
                sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

}