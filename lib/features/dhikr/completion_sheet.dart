import 'package:flutter/material.dart';
import '../../core/data/reflections.dart';
import '../../core/models.dart';
import '../../core/palette.dart';
import '../../ui/common.dart';

/// Shown only after a session ends: the completed quantity plus a Qur'anic reflection.
/// Returns the optional note the user typed (or null if dismissed).
Future<String?> showCompletionSheet(BuildContext context, SessionRecord rec, Reflection reflection) {
  final c = context.nc;
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    isDismissible: false,
    enableDrag: false,
    backgroundColor: c.panel,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    builder: (ctx) => _CompletionSheet(rec: rec, reflection: reflection),
  );
}

class _CompletionSheet extends StatefulWidget {
  final SessionRecord rec;
  final Reflection reflection;
  const _CompletionSheet({required this.rec, required this.reflection});
  @override
  State<_CompletionSheet> createState() => _CompletionSheetState();
}

class _CompletionSheetState extends State<_CompletionSheet> {
  final TextEditingController _note = TextEditingController();
  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  String _duration(int s) {
    if (s < 60) return '$s sec';
    final m = s ~/ 60, r = s % 60;
    return r == 0 ? '$m min' : '$m min $r sec';
  }

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    final rec = widget.rec, r = widget.reflection;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 26, 24, 20),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            CrescentMark(size: 46, color: c.gold),
            const SizedBox(height: 8),
            Eyebrow(rec.targetMet ? 'Session complete' : 'Session ended'),
            const SizedBox(height: 10),
            Text('${rec.count}', style: TextStyle(fontFamily: kSerif, fontSize: 76, height: 1, color: c.gold)),
            const SizedBox(height: 6),
            Text(rec.name, textAlign: TextAlign.center, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: c.text)),
            const SizedBox(height: 4),
            Text(
              rec.targetMet
                  ? 'Target of ${rec.target} reached · ${_duration(rec.seconds)}'
                  : 'Ended at ${rec.count} of ${rec.target} · ${_duration(rec.seconds)}',
              style: TextStyle(fontSize: 12, color: c.muted),
            ),
            const SizedBox(height: 20),
            Container(height: 1, color: c.line),
            const SizedBox(height: 18),
            const Eyebrow('A reflection'),
            const SizedBox(height: 6),
            ArabicText(r.arabic, size: 25),
            const SizedBox(height: 6),
            Text(r.translation, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, height: 1.55, color: c.text)),
            const SizedBox(height: 8),
            Text(r.reference, style: TextStyle(fontSize: 11, letterSpacing: .5, color: c.muted)),
            const SizedBox(height: 20),
            TextField(
              controller: _note, maxLines: 2, maxLength: 200,
              decoration: noorField(context, hint: 'Add a note to this session (optional)'),
            ),
            const SizedBox(height: 10),
            SizedBox(width: double.infinity, child: FilledButton(onPressed: () => Navigator.pop(context, _note.text), child: const Text('Done'))),
          ]),
        ),
      ),
    );
  }
}
