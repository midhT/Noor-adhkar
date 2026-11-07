import 'dart:io';
import 'package:audioplayers/audioplayers.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'store.dart';

/// Optional Focus Studio audio: a bundled generated ambient loop, or the user's own file
/// (copied into app storage so it survives restarts). Audio is never started implicitly.
class FocusAudio {
  static final FocusAudio instance = FocusAudio._();
  FocusAudio._();

  AudioPlayer? _player;
  bool playing = false;

  AudioPlayer get _p => _player ??= AudioPlayer();

  /// Starts looping playback. Returns an error message, or null on success.
  Future<String?> start() async {
    final s = NoorStore.instance;
    try {
      final p = _p;
      await p.setReleaseMode(ReleaseMode.loop);
      await p.setVolume(s.audioVolume);
      if (s.audioMode == 'file') {
        if (s.audioPath.isEmpty || !File(s.audioPath).existsSync()) {
          return 'Your audio file is missing. Choose it again.';
        }
        await p.play(DeviceFileSource(s.audioPath));
      } else {
        await p.play(AssetSource('audio/night_pad.wav'));
      }
      playing = true;
      return null;
    } catch (e) {
      playing = false;
      debugPrint('Noor audio failed: $e');
      return 'Audio could not start on this device.';
    }
  }

  Future<void> stop() async {
    playing = false;
    try {
      await _player?.stop();
    } catch (_) {}
  }

  Future<void> setVolume(double v) async {
    try {
      await _player?.setVolume(v);
    } catch (_) {}
  }

  /// Lets the user choose an audio file. Returns an error message, or null on success/cancel.
  Future<String?> pickFile() async {
    try {
      final res = await FilePicker.platform.pickFiles(type: FileType.audio);
      if (res == null || res.files.isEmpty) return null;
      final f = res.files.single;
      final src = f.path;
      if (src == null) return 'That file could not be read.';
      final dir = await getApplicationSupportDirectory();
      final dot = f.name.lastIndexOf('.');
      final ext = dot >= 0 ? f.name.substring(dot + 1) : 'audio';
      final old = NoorStore.instance.audioPath;
      if (old.isNotEmpty && File(old).existsSync()) {
        try {
          File(old).deleteSync();
        } catch (_) {}
      }
      final dest = '${dir.path}/focus_audio.$ext';
      await File(src).copy(dest);
      NoorStore.instance.update(() {
        NoorStore.instance.audioPath = dest;
        NoorStore.instance.audioName = f.name;
        NoorStore.instance.audioMode = 'file';
      });
      return null;
    } catch (e) {
      debugPrint('Noor audio pick failed: $e');
      return 'Could not add that audio file.';
    }
  }
}
