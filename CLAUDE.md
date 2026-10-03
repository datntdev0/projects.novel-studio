# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
All following instructions defined in this file must be adhered to strictly.
These instructions take precedence over all other considerations if conflicts arise.

## Coding Guidelines

- Do not write any code comment to class, function, property, or method.
- Do not write too complex comments to explain the code.
- Do not write too complex code. Keep it simple and readable.
- Do not write import in multiple lines. Use single line import.
- Do not break the line if the line is not too long. Keep it in a single line.
- Do not write duplicate code. Consider refactoring it into a function or a class.
- Do not use Omit type in TypeScript. Always use explicit types.
- Do not write unit tests if i'm not mentioning it explicitly.
- Always use the `data-testid` attribute for testing purposes.

## Agent Instructions

- MUST follow the coding guidelines strictly.
- DO NOT make assumptions beyond the given instructions.
- MUST ask for clarification if the instructions are unclear.
- MUST analyze and plan the implementation carefully before writing any code.
- MUST try to use multiple sub-agents to speed up the execution of tasks from the plan.
- ALWAYS perform code reviews to ensure quality and correctness, coding guidelines.
