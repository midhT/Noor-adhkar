#!/usr/bin/env python3
"""Offline sanity checks for Dart sources (no Dart SDK needed).

  python3 tool/check_dart.py            # checks lib/ and test/

Checks:
  1. bracket/paren/brace balance, honouring strings, comments and ${} interpolation
  2. every local import points at an existing file
  3. every top-level symbol used from another local file is imported (undefined-name class of error)
  4. local imports that provide nothing the file uses (analyzer: unused_import warning)

This is NOT a compiler. It catches the cheap mistakes so CI is not the first to see them.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAIRS = {')': '(', ']': '[', '}': '{'}


def strip_code(src, path):
    """Returns (code_without_strings_and_comments, errors). Strings are replaced by "" so that
    identifiers inside them are not counted; ${expr} interpolations are kept as code."""
    out, errs = [], []
    i, n, line = 0, len(src), 1
    stack = []  # bracket stack of (char, line)
    # string-mode stack: each entry = (quote, triple, raw, brace_depth_at_entry)
    smode = []
    while i < n:
        ch = src[i]
        if ch == '\n':
            line += 1
        if smode and smode[-1] is not None:
            q, triple, raw, depth = smode[-1]
            if ch == '\\' and not raw:
                i += 2
                continue
            if not raw and ch == '$' and i + 1 < n and src[i + 1] == '{':
                stack.append(('${', line))
                smode.append(None)  # code inside interpolation
                out.append(' ')
                i += 2
                continue
            if not raw and ch == '$' and i + 1 < n and (src[i + 1].isalpha() or src[i + 1] == '_'):
                j = i + 1
                while j < n and (src[j].isalnum() or src[j] == '_'):
                    j += 1
                out.append(' ' + src[i + 1:j] + ' ')
                i = j
                continue
            if triple and src.startswith(q * 3, i):
                smode.pop()
                i += 3
                continue
            if not triple and ch == q:
                smode.pop()
                i += 1
                continue
            i += 1
            continue
        # code mode (possibly inside an interpolation)
        if src.startswith('//', i):
            while i < n and src[i] != '\n':
                i += 1
            continue
        if src.startswith('/*', i):
            j = src.find('*/', i + 2)
            if j < 0:
                errs.append(f'{path}:{line}: unterminated block comment')
                break
            line += src.count('\n', i, j)
            i = j + 2
            continue
        if ch in '\'"':
            raw = i > 0 and src[i - 1] == 'r' and not (i > 1 and (src[i - 2].isalnum() or src[i - 2] == '_'))
            triple = src.startswith(ch * 3, i)
            smode.append((ch, triple, raw, 0))
            out.append(' "" ')
            i += 3 if triple else 1
            continue
        if ch in '([{':
            stack.append((ch, line))
        elif ch in ')]}':
            if not stack:
                errs.append(f'{path}:{line}: unmatched {ch}')
            else:
                top, tl = stack[-1]
                if top == '${':
                    if ch == '}':
                        stack.pop()
                        smode_pop_interp(smode)
                        i += 1
                        continue
                    errs.append(f'{path}:{line}: {ch} closes ${{ opened on line {tl}')
                    stack.pop()
                elif PAIRS[ch] != top:
                    errs.append(f'{path}:{line}: {ch} does not match {top} opened on line {tl}')
                    stack.pop()
                else:
                    stack.pop()
        out.append(ch)
        i += 1
    if any(m is not None for m in smode):
        errs.append(f'{path}: unterminated string')
    for ch, tl in stack:
        errs.append(f'{path}:{tl}: unclosed {ch}')
    return ''.join(out), errs


def smode_pop_interp(smode):
    # remove the None marker pushed for an interpolation
    for k in range(len(smode) - 1, -1, -1):
        if smode[k] is None:
            del smode[k]
            return


DECL = [
    re.compile(r'^(?:abstract\s+|final\s+|base\s+|sealed\s+|interface\s+)*(?:class|mixin|enum|typedef)\s+([A-Za-z]\w*)', re.M),
    re.compile(r'^extension\s+([A-Za-z]\w*)', re.M),
    re.compile(r'^(?:const|final|var)\s+(?:[\w<>?,.\[\] ()]+?\s+)?([a-zA-Z]\w*)\s*=', re.M),
    re.compile(r'^(?:Future<[^>]*>|Future|void|bool|int|double|num|String|Path|Color|Widget|ThemeData|DateTime|Duration|List<[^>]*>|Map<[^>]*>|Set<[^>]*>|\(int, int\)\?|[A-Z]\w*\??)\s+([a-zA-Z]\w*)\s*\(', re.M),
]


def top_symbols(code):
    syms = set()
    for rx in DECL:
        for m in rx.finditer(code):
            name = m.group(1)
            if not name.startswith('_') and name != 'main':
                syms.add(name)
    if re.search(r'^extension\s', code, re.M):
        # extension members are used as `x.member`, so count their getter names as provided symbols
        syms |= set(re.findall(r'\bget\s+([a-zA-Z]\w*)', code))
    return syms


def main():
    files = []
    for base in ('lib', 'test'):
        for dp, _, fns in os.walk(os.path.join(ROOT, base)):
            for f in fns:
                if f.endswith('.dart'):
                    files.append(os.path.join(dp, f))
    codes, errors, provides = {}, [], {}
    for p in sorted(files):
        rel = os.path.relpath(p, ROOT)
        src = open(p, encoding='utf-8').read()
        code, errs = strip_code(src, rel)
        codes[p] = (src, code)
        errors += errs
        provides[p] = top_symbols(code)

    imp_rx = re.compile(r'''^(?:import|export)\s+['"]([^'"]+)['"]''', re.M)
    for p, (src, code) in codes.items():
        rel = os.path.relpath(p, ROOT)
        imported = set()
        for m in imp_rx.finditer(src):
            target = m.group(1)
            if target.startswith('package:noor/'):
                t = os.path.join(ROOT, 'lib', target[len('package:noor/'):])
            elif target.startswith(('dart:', 'package:')):
                continue
            else:
                t = os.path.normpath(os.path.join(os.path.dirname(p), target))
            if not os.path.exists(t):
                errors.append(f'{rel}: import of missing file {target}')
            else:
                imported.add(t)
        used_words = set(re.findall(r'\b[A-Za-z_]\w*\b', code))
        for other, syms in provides.items():
            if other == p:
                continue
            need = syms & used_words
            if need and other not in imported:
                # a test importing package:noor is already resolved above; report the miss
                errors.append(f'{rel}: uses {sorted(need)[:4]} from {os.path.relpath(other, ROOT)} without importing it')
        for t in imported:
            if not (provides.get(t, set()) & used_words):
                errors.append(f'{rel}: unused import {os.path.relpath(t, ROOT)} (analyzer warning)')
    for e in errors:
        print('ERROR', e)
    print(f'checked {len(files)} files, {len(errors)} problem(s)')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
