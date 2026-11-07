import 'package:flutter/material.dart';
import '../../core/data/dhikr_data.dart';
import '../../core/models.dart';
import '../../core/palette.dart';
import '../../core/store.dart';
import '../../ui/common.dart';

Future<void> showLibrarySheet(BuildContext context) {
  final c = context.nc;
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: c.panel,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    builder: (ctx) => const _LibrarySheet(),
  );
}

class _LibrarySheet extends StatefulWidget {
  const _LibrarySheet();
  @override
  State<_LibrarySheet> createState() => _LibrarySheetState();
}

class _LibrarySheetState extends State<_LibrarySheet> {
  final NoorStore store = NoorStore.instance;
  String query = '';
  String category = 'All';

  List<String> get categories {
    final set = <String>{'All'};
    if (store.customs.isNotEmpty) set.add('Custom');
    for (final p in dhikrPresets) {
      set.add(p.category);
    }
    return set.toList();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    final height = MediaQuery.of(context).size.height * .88;
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final q = query.toLowerCase().trim();
        final items = store.allPresets.where((p) {
          if (category != 'All' && p.category != category) return false;
          if (q.isEmpty) return true;
          return '${p.name} ${p.meaning} ${p.category}'.toLowerCase().contains(q);
        }).toList();
        return SizedBox(
          height: height,
          child: Padding(
            padding: EdgeInsets.fromLTRB(18, 18, 18, MediaQuery.of(context).viewInsets.bottom),
            child: Column(children: [
              Row(children: [
                Expanded(child: ScreenTitle('Words to return to', 'Dhikr library')),
                IconButton(onPressed: () => Navigator.pop(context), icon: Icon(Icons.close_rounded, color: c.muted)),
              ]),
              TextField(
                onChanged: (v) => setState(() => query = v),
                decoration: noorField(context, hint: 'Search dhikr…').copyWith(prefixIcon: Icon(Icons.search, color: c.gold)),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 38,
                child: ListView(scrollDirection: Axis.horizontal, children: [
                  for (final cat in categories)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(cat), selected: category == cat, showCheckmark: false,
                        onSelected: (_) => setState(() => category = cat),
                        selectedColor: c.gold.withValues(alpha: .2), backgroundColor: c.panel2,
                        side: BorderSide(color: category == cat ? c.gold : c.line),
                        labelStyle: TextStyle(fontSize: 12, color: category == cat ? c.gold : c.muted),
                      ),
                    ),
                ]),
              ),
              const SizedBox(height: 10),
              Expanded(
                child: ListView(children: [
                  OutlinedButton.icon(
                    onPressed: () async {
                      final created = await showCustomEditor(context);
                      if (created != null) {
                        store.saveCustom(created);
                        if (!store.hasActive) store.selectPreset(created.id);
                        if (context.mounted) Navigator.pop(context);
                      }
                    },
                    icon: const Icon(Icons.add_rounded), label: const Text('New custom dhikr'),
                  ),
                  const SizedBox(height: 10),
                  if (items.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text('No dhikr matches your search.', textAlign: TextAlign.center, style: TextStyle(color: c.muted)),
                    ),
                  for (final p in items)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: NoorCard(
                        borderColor: p.id == store.selectedPresetId ? c.gold : null,
                        onTap: () {
                          if (store.hasActive) {
                            showToast(context, 'Finish or discard the current session first.');
                            return;
                          }
                          store.selectPreset(p.id);
                          Navigator.pop(context);
                        },
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Eyebrow(p.category),
                            const Spacer(),
                            if (p.custom)
                              PopupMenuButton<String>(
                                icon: Icon(Icons.more_horiz, color: c.muted),
                                color: c.panel2,
                                onSelected: (v) async {
                                  if (v == 'edit') {
                                    final old = store.customs.firstWhere((x) => x.id == p.id);
                                    final edited = await showCustomEditor(context, existing: old);
                                    if (edited != null) store.saveCustom(edited);
                                  } else if (v == 'delete') {
                                    if (store.hasActive && store.active!.presetId == p.id) {
                                      showToast(context, 'This dhikr is in an active session.');
                                      return;
                                    }
                                    final ok = await confirmDialog(context,
                                        title: 'Delete “${p.name}”?',
                                        message: 'Past sessions stay in your history.',
                                        confirm: 'Delete', destructive: true);
                                    if (ok) store.deleteCustom(p.id);
                                  }
                                },
                                itemBuilder: (_) => const [
                                  PopupMenuItem(value: 'edit', child: Text('Edit')),
                                  PopupMenuItem(value: 'delete', child: Text('Delete')),
                                ],
                              ),
                          ]),
                          ArabicText(p.arabic, size: 24),
                          Text(p.name, style: TextStyle(fontWeight: FontWeight.w700, color: c.text)),
                          const SizedBox(height: 3),
                          Text(p.meaning, style: TextStyle(fontSize: 12, height: 1.4, color: c.muted)),
                          const SizedBox(height: 8),
                          Row(children: [
                            Expanded(child: Text(p.note, style: TextStyle(fontSize: 11, color: c.gold2))),
                            Text('Target ${p.isSet ? p.totalTarget : store.targetsFor(p).first}',
                                style: TextStyle(fontSize: 11, color: c.gold)),
                          ]),
                        ]),
                      ),
                    ),
                ]),
              ),
            ]),
          ),
        );
      },
    );
  }
}

Future<CustomDhikr?> showCustomEditor(BuildContext context, {CustomDhikr? existing}) {
  return showDialog<CustomDhikr>(context: context, builder: (ctx) => _CustomEditor(existing: existing));
}

class _CustomEditor extends StatefulWidget {
  final CustomDhikr? existing;
  const _CustomEditor({this.existing});
  @override
  State<_CustomEditor> createState() => _CustomEditorState();
}

class _CustomEditorState extends State<_CustomEditor> {
  late final TextEditingController name, arabic, meaning, target;
  String? error;
  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    name = TextEditingController(text: e?.name ?? '');
    arabic = TextEditingController(text: e?.arabic ?? '');
    meaning = TextEditingController(text: e?.meaning ?? '');
    target = TextEditingController(text: '${e?.target ?? 100}');
  }

  @override
  void dispose() {
    name.dispose();
    arabic.dispose();
    meaning.dispose();
    target.dispose();
    super.dispose();
  }

  void _save() {
    final n = name.text.trim();
    final t = int.tryParse(target.text.trim());
    if (n.isEmpty) {
      setState(() => error = 'Give your dhikr a name.');
      return;
    }
    if (t == null || t < 1 || t > 10000) {
      setState(() => error = 'Target must be between 1 and 10000.');
      return;
    }
    Navigator.pop(
      context,
      CustomDhikr(
        id: widget.existing?.id ?? NoorStore.instance.newId(),
        name: n, arabic: arabic.text.trim(), meaning: meaning.text.trim(), target: t,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.nc;
    return AlertDialog(
      title: Text(widget.existing == null ? 'New custom dhikr' : 'Edit dhikr'),
      content: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(controller: name, maxLength: 100, decoration: noorField(context, label: 'Name (required)')),
          const SizedBox(height: 6),
          TextField(controller: arabic, textDirection: TextDirection.rtl, decoration: noorField(context, label: 'Arabic text (optional)')),
          const SizedBox(height: 12),
          TextField(controller: meaning, decoration: noorField(context, label: 'Meaning (optional)')),
          const SizedBox(height: 12),
          TextField(controller: target, keyboardType: TextInputType.number, decoration: noorField(context, label: 'Default target')),
          if (error != null)
            Padding(padding: const EdgeInsets.only(top: 10), child: Text(error!, style: TextStyle(color: c.danger, fontSize: 12))),
        ]),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: c.muted))),
        TextButton(onPressed: _save, child: const Text('Save')),
      ],
    );
  }
}
