const encoder = new TextEncoder();
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

const INLINE_ASSETS = {"/index.html":{"type":"text/html; charset=utf-8","body":"PCFkb2N0eXBlIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiIC8+CiAgPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAiIC8+CiAgPG1ldGEgbmFtZT0iZGVzY3JpcHRpb24iIGNvbnRlbnQ9IkNsaWVudCBTb2NpYWwg4oCUIHNvY2lhbCBwdWJsaXNoaW5nIGF1dG9tYXRpb24gZm9yIGFnZW5jaWVzIGFuZCBjcmVhdG9ycy4iIC8+CiAgPHRpdGxlPkNsaWVudCBTb2NpYWwgU2FhUzwvdGl0bGU+CiAgPGxpbmsgcmVsPSJzdHlsZXNoZWV0IiBocmVmPSIuL3N0eWxlcy5jc3MiIC8+CjwvaGVhZD4KPGJvZHk+CiAgPGhlYWRlciBjbGFzcz0idG9wYmFyIj48YSBjbGFzcz0iYnJhbmQiIGhyZWY9IiMiPkNsaWVudCBTb2NpYWw8L2E+PG5hdj48YSBocmVmPSIjZGFzaGJvYXJkIj5EYXNoYm9hcmQ8L2E+PGEgaHJlZj0iI3NldHVwIj5TZXR1cDwvYT48YSBocmVmPSIjaGlzdG9yeSI+SGlzdG9yeTwvYT48L25hdj48YnV0dG9uIGlkPSJsb2dvdXQiIGNsYXNzPSJ0ZXh0LWJ1dHRvbiIgaGlkZGVuPkxvZyBvdXQ8L2J1dHRvbj48L2hlYWRlcj4KICA8bWFpbiBjbGFzcz0ic2hlbGwiPgogICAgPHNlY3Rpb24gaWQ9ImF1dGgiIGNsYXNzPSJhdXRoIHNlY3Rpb24iPgogICAgICA8ZGl2PjxwIGNsYXNzPSJleWVicm93Ij5DTElFTlQgUE9SVEFMPC9wPjxoMT5SdW4geW91ciBzb2NpYWwgcHVibGlzaGluZyBzZXJ2aWNlIGZyb20gb25lIHBsYWNlLjwvaDE+PHAgY2xhc3M9Imhlcm8tY29weSI+Q3JlYXRlIGEgd29ya3NwYWNlLCBxdWV1ZSBjb250ZW50LCBhbmQgbGV0IE1ha2UgaGFuZGxlIHB1Ymxpc2hpbmcuPC9wPjwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJhdXRoLWNhcmQiPjxkaXYgY2xhc3M9InRhYnMiPjxidXR0b24gaWQ9ImxvZ2luLXRhYiIgY2xhc3M9InRhYiBhY3RpdmUiPkxvZyBpbjwvYnV0dG9uPjxidXR0b24gaWQ9InNpZ251cC10YWIiIGNsYXNzPSJ0YWIiPkNyZWF0ZSBhY2NvdW50PC9idXR0b24+PC9kaXY+CiAgICAgICAgPGZvcm0gaWQ9ImxvZ2luLWZvcm0iPjxpbnB1dCBuYW1lPSJlbWFpbCIgdHlwZT0iZW1haWwiIHBsYWNlaG9sZGVyPSJFbWFpbCIgcmVxdWlyZWQ+PGlucHV0IG5hbWU9InBhc3N3b3JkIiB0eXBlPSJwYXNzd29yZCIgcGxhY2Vob2xkZXI9IlBhc3N3b3JkIiByZXF1aXJlZD48YnV0dG9uIGNsYXNzPSJidXR0b24gcHJpbWFyeSIgdHlwZT0ic3VibWl0Ij5Mb2cgaW48L2J1dHRvbj48L2Zvcm0+CiAgICAgICAgPGZvcm0gaWQ9InNpZ251cC1mb3JtIiBoaWRkZW4+PGlucHV0IG5hbWU9ImVtYWlsIiB0eXBlPSJlbWFpbCIgcGxhY2Vob2xkZXI9IkVtYWlsIiByZXF1aXJlZD48aW5wdXQgbmFtZT0icGFzc3dvcmQiIHR5cGU9InBhc3N3b3JkIiBtaW5sZW5ndGg9IjgiIHBsYWNlaG9sZGVyPSJQYXNzd29yZCAoOCsgY2hhcmFjdGVycykiIHJlcXVpcmVkPjxpbnB1dCBuYW1lPSJkaXNwbGF5X25hbWUiIHBsYWNlaG9sZGVyPSJZb3VyIG5hbWUiPjxpbnB1dCBuYW1lPSJjbGllbnRfbmFtZSIgcGxhY2Vob2xkZXI9IldvcmtzcGFjZSBuYW1lIj48YnV0dG9uIGNsYXNzPSJidXR0b24gcHJpbWFyeSIgdHlwZT0ic3VibWl0Ij5DcmVhdGUgd29ya3NwYWNlPC9idXR0b24+PC9mb3JtPgogICAgICAgIDxwIGlkPSJhdXRoLW1lc3NhZ2UiIGNsYXNzPSJtdXRlZCI+PC9wPgogICAgICA8L2Rpdj4KICAgIDwvc2VjdGlvbj4KCiAgICA8ZGl2IGlkPSJwb3J0YWwiIGhpZGRlbj4KICAgICAgPHNlY3Rpb24gaWQ9ImRhc2hib2FyZCIgY2xhc3M9InNlY3Rpb24iPjxkaXYgY2xhc3M9InNlY3Rpb24taGVhZGluZyI+PGRpdj48cCBjbGFzcz0iZXllYnJvdyI+T1ZFUlZJRVc8L3A+PGgyPlB1Ymxpc2hpbmcgZGFzaGJvYXJkPC9oMj48L2Rpdj48c3BhbiBjbGFzcz0icGlsbCI+RlJFRSBNVlA8L3NwYW4+PC9kaXY+PGRpdiBjbGFzcz0ic3RhdHMiPjxhcnRpY2xlPjxzcGFuPlF1ZXVlZDwvc3Bhbj48c3Ryb25nIGlkPSJxdWV1ZWQtY291bnQiPjA8L3N0cm9uZz48c21hbGw+V2FpdGluZyB0byBwdWJsaXNoPC9zbWFsbD48L2FydGljbGU+PGFydGljbGU+PHNwYW4+UHVibGlzaGVkPC9zcGFuPjxzdHJvbmcgaWQ9InB1Ymxpc2hlZC1jb3VudCI+MDwvc3Ryb25nPjxzbWFsbD5DdXJyZW50IHdvcmtzcGFjZTwvc21hbGw+PC9hcnRpY2xlPjxhcnRpY2xlPjxzcGFuPkZhaWxlZDwvc3Bhbj48c3Ryb25nIGlkPSJmYWlsZWQtY291bnQiPjA8L3N0cm9uZz48c21hbGw+TmVlZHMgYXR0ZW50aW9uPC9zbWFsbD48L2FydGljbGU+PGFydGljbGU+PHNwYW4+UGxhbjwvc3Bhbj48c3Ryb25nPkZyZWU8L3N0cm9uZz48c21hbGw+MTAgam9icyAvIG1vbnRoPC9zbWFsbD48L2FydGljbGU+PC9kaXY+PC9zZWN0aW9uPgogICAgICA8c2VjdGlvbiBpZD0ic2V0dXAiIGNsYXNzPSJzZWN0aW9uIHNldHVwLWdyaWQiPjxkaXY+PHAgY2xhc3M9ImV5ZWJyb3ciPldPUktTUEFDRTwvcD48aDI+Q29ubmVjdGVkIHNlcnZpY2VzPC9oMj48cCBjbGFzcz0ibXV0ZWQiPkNyZWRlbnRpYWxzIHN0YXkgc2VydmVyLXNpZGUuIENvbm5lY3Rpb24gT0F1dGggd2lsbCBiZSBlbmFibGVkIGluIHRoZSBuZXh0IGludGVncmF0aW9uIHN0YWdlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPSJjb25uZWN0aW9ucyI+PGRpdiBjbGFzcz0iY29ubmVjdGlvbiIgZGF0YS1wcm92aWRlcj0ieW91dHViZSI+PGRpdj48c3Ryb25nPllvdVR1YmU8L3N0cm9uZz48c21hbGw+VmlkZW8gcHVibGlzaGluZzwvc21hbGw+PC9kaXY+PHNwYW4gY2xhc3M9InBpbGwiPk5vdCBjb25uZWN0ZWQ8L3NwYW4+PC9kaXY+PGRpdiBjbGFzcz0iY29ubmVjdGlvbiIgZGF0YS1wcm92aWRlcj0iaW5zdGFncmFtIj48ZGl2PjxzdHJvbmc+SW5zdGFncmFtPC9zdHJvbmc+PHNtYWxsPlJlZWwgcHVibGlzaGluZzwvc21hbGw+PC9kaXY+PHNwYW4gY2xhc3M9InBpbGwiPk5vdCBjb25uZWN0ZWQ8L3NwYW4+PC9kaXY+PC9kaXY+PC9zZWN0aW9uPgogICAgICA8c2VjdGlvbiBjbGFzcz0ic2VjdGlvbiI+PGRpdiBjbGFzcz0ic2VjdGlvbi1oZWFkaW5nIj48ZGl2PjxwIGNsYXNzPSJleWVicm93Ij5QVUJMSVNIPC9wPjxoMj5RdWV1ZSBjb250ZW50PC9oMj48L2Rpdj48L2Rpdj48Zm9ybSBpZD0iam9iLWZvcm0iIGNsYXNzPSJqb2ItZm9ybSI+PGlucHV0IG5hbWU9InNvdXJjZV9maWxlX3VybCIgdHlwZT0idXJsIiBwbGFjZWhvbGRlcj0iTWVkaWEgVVJMIChlLmcuIERyaXZlIGZpbGUgVVJMKSIgcmVxdWlyZWQ+PGlucHV0IG5hbWU9InRpdGxlIiBwbGFjZWhvbGRlcj0iUG9zdCB0aXRsZSI+PHRleHRhcmVhIG5hbWU9ImRlc2NyaXB0aW9uIiBwbGFjZWhvbGRlcj0iRGVzY3JpcHRpb24gLyBjYXB0aW9uIj48L3RleHRhcmVhPjxkaXYgY2xhc3M9ImNoZWNrcyI+PGxhYmVsPjxpbnB1dCBuYW1lPSJ5b3V0dWJlIiB0eXBlPSJjaGVja2JveCIgY2hlY2tlZD4gWW91VHViZTwvbGFiZWw+PGxhYmVsPjxpbnB1dCBuYW1lPSJpbnN0YWdyYW0iIHR5cGU9ImNoZWNrYm94IiBjaGVja2VkPiBJbnN0YWdyYW08L2xhYmVsPjwvZGl2PjxidXR0b24gY2xhc3M9ImJ1dHRvbiBwcmltYXJ5IiB0eXBlPSJzdWJtaXQiPlF1ZXVlIHB1Ymxpc2hpbmcgam9iPC9idXR0b24+PHAgaWQ9ImpvYi1tZXNzYWdlIiBjbGFzcz0ibXV0ZWQiPjwvcD48L2Zvcm0+PC9zZWN0aW9uPgogICAgICA8c2VjdGlvbiBpZD0iaGlzdG9yeSIgY2xhc3M9InNlY3Rpb24iPjxkaXYgY2xhc3M9InNlY3Rpb24taGVhZGluZyI+PGRpdj48cCBjbGFzcz0iZXllYnJvdyI+QUNUSVZJVFk8L3A+PGgyPlB1Ymxpc2hpbmcgaGlzdG9yeTwvaDI+PC9kaXY+PC9kaXY+PGRpdiBpZD0iam9iLWxpc3QiPjxkaXYgY2xhc3M9ImVtcHR5Ij48c3Ryb25nPk5vIHB1Ymxpc2hpbmcgam9icyB5ZXQ8L3N0cm9uZz48cD5Zb3VyIHF1ZXVlZCBqb2JzIHdpbGwgYXBwZWFyIGhlcmUuPC9wPjwvZGl2PjwvZGl2Pjwvc2VjdGlvbj4KICAgIDwvZGl2PgogIDwvbWFpbj4KICA8Zm9vdGVyPjxzcGFuPkNsaWVudCBTb2NpYWwgU2FhUzwvc3Bhbj48c3Bhbj4kMC1maXJzdCBNVlA8L3NwYW4+PC9mb290ZXI+CiAgPHNjcmlwdCBzcmM9Ii4vYXBwLmpzIj48L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+Cg=="},"/app.js":{"type":"text/javascript; charset=utf-8","body":"Y29uc3QgQVBJX0JBU0UgPSB3aW5kb3cuQ0xJRU5UX1NPQ0lBTF9BUEkgfHwgIiI7CmNvbnN0IHRva2VuS2V5ID0gImNsaWVudF9zb2NpYWxfYWNjZXNzX3Rva2VuIjsKCmNvbnN0ICQgPSAoc2VsZWN0b3IpID0+IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpOwpjb25zdCB0b2tlbiA9ICgpID0+IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHRva2VuS2V5KTsKCmFzeW5jIGZ1bmN0aW9uIGFwaShwYXRoLCBvcHRpb25zID0ge30pIHsKICBjb25zdCBoZWFkZXJzID0geyAiY29udGVudC10eXBlIjogImFwcGxpY2F0aW9uL2pzb24iLCAuLi4ob3B0aW9ucy5oZWFkZXJzIHx8IHt9KSB9OwogIGlmICh0b2tlbigpKSBoZWFkZXJzLmF1dGhvcml6YXRpb24gPSBgQmVhcmVyICR7dG9rZW4oKX1gOwogIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7QVBJX0JBU0V9JHtwYXRofWAsIHsgLi4ub3B0aW9ucywgaGVhZGVycyB9KTsKICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpLmNhdGNoKCgpID0+ICh7fSkpOwogIGlmICghcmVzcG9uc2Uub2spIHRocm93IG5ldyBFcnJvcihkYXRhLmVycm9yIHx8ICJSZXF1ZXN0IGZhaWxlZCIpOwogIHJldHVybiBkYXRhOwp9CgpmdW5jdGlvbiBzaG93UG9ydGFsKCkgewogICQoIiNhdXRoIikuaGlkZGVuID0gdHJ1ZTsKICAkKCIjcG9ydGFsIikuaGlkZGVuID0gZmFsc2U7CiAgJCgiI2xvZ291dCIpLmhpZGRlbiA9IGZhbHNlOwogIGxvYWREYXNoYm9hcmQoKTsKfQpmdW5jdGlvbiBzaG93QXV0aCgpIHsKICAkKCIjYXV0aCIpLmhpZGRlbiA9IGZhbHNlOwogICQoIiNwb3J0YWwiKS5oaWRkZW4gPSB0cnVlOwogICQoIiNsb2dvdXQiKS5oaWRkZW4gPSB0cnVlOwp9CmZ1bmN0aW9uIHJlbmRlckpvYnMoam9icykgewogIGNvbnN0IGxpc3QgPSAkKCIjam9iLWxpc3QiKTsKICBpZiAoIWxpc3QpIHJldHVybjsKICBpZiAoIWpvYnMubGVuZ3RoKSB7CiAgICBsaXN0LmlubmVySFRNTCA9ICI8ZGl2IGNsYXNzPVwiZW1wdHlcIj48c3Ryb25nPk5vIHB1Ymxpc2hpbmcgam9icyB5ZXQ8L3N0cm9uZz48cD5DcmVhdGUgeW91ciBmaXJzdCBqb2IgdG8gc2VlIGl0cyBwcm9ncmVzcyBoZXJlLjwvcD48L2Rpdj4iOwogICAgcmV0dXJuOwogIH0KICBsaXN0LmlubmVySFRNTCA9IGpvYnMubWFwKChqb2IpID0+IGA8ZGl2IGNsYXNzPSJqb2IiPjxkaXY+PHN0cm9uZz4ke2VzY2FwZUh0bWwoam9iLnRpdGxlIHx8ICJVbnRpdGxlZCIpfTwvc3Ryb25nPjxzbWFsbD4ke2VzY2FwZUh0bWwoam9iLnNvdXJjZV9maWxlX3VybCl9PC9zbWFsbD48L2Rpdj48c3BhbiBjbGFzcz0icGlsbCI+JHtlc2NhcGVIdG1sKGpvYi5zdGF0dXMpfTwvc3Bhbj48L2Rpdj5gKS5qb2luKCIiKTsKfQpmdW5jdGlvbiBlc2NhcGVIdG1sKHZhbHVlKSB7CiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucmVwbGFjZSgvWyY8PiInXS9nLCAoY2hhcmFjdGVyKSA9PiAoeyAiJiI6ICImYW1wOyIsICI8IjogIiZsdDsiLCAiPiI6ICImZ3Q7IiwgIiciOiAiJiMzOTsiLCAnIic6ICImcXVvdDsiIH1bY2hhcmFjdGVyXSkpOwp9CmFzeW5jIGZ1bmN0aW9uIGxvYWREYXNoYm9hcmQoKSB7CiAgaWYgKCF0b2tlbigpKSByZXR1cm47CiAgdHJ5IHsKICAgIGNvbnN0IFt7IGpvYnMgfSwgeyBjb25uZWN0aW9ucyB9XSA9IGF3YWl0IFByb21pc2UuYWxsKFthcGkoIi9hcGkvam9icyIpLCBhcGkoIi9hcGkvY29ubmVjdGlvbnMiKV0pOwogICAgcmVuZGVySm9icyhqb2JzKTsKICAgICQoIiNxdWV1ZWQtY291bnQiKS50ZXh0Q29udGVudCA9IGpvYnMuZmlsdGVyKChqb2IpID0+IGpvYi5zdGF0dXMgPT09ICJxdWV1ZWQiIHx8IGpvYi5zdGF0dXMgPT09ICJwcm9jZXNzaW5nIikubGVuZ3RoOwogICAgJCgiI3B1Ymxpc2hlZC1jb3VudCIpLnRleHRDb250ZW50ID0gam9icy5maWx0ZXIoKGpvYikgPT4gam9iLnN0YXR1cyA9PT0gInB1Ymxpc2hlZCIpLmxlbmd0aDsKICAgICQoIiNmYWlsZWQtY291bnQiKS50ZXh0Q29udGVudCA9IGpvYnMuZmlsdGVyKChqb2IpID0+IGpvYi5zdGF0dXMgPT09ICJmYWlsZWQiKS5sZW5ndGg7CiAgICBjb25uZWN0aW9ucy5mb3JFYWNoKChjb25uZWN0aW9uKSA9PiB7CiAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wcm92aWRlcj0iJHtjb25uZWN0aW9uLnByb3ZpZGVyfSJdIC5waWxsYCk7CiAgICAgIGlmIChub2RlKSBub2RlLnRleHRDb250ZW50ID0gY29ubmVjdGlvbi5zdGF0dXMgPT09ICJjb25uZWN0ZWQiID8gIkNvbm5lY3RlZCIgOiAiTm90IGNvbm5lY3RlZCI7CiAgICB9KTsKICB9IGNhdGNoIChlcnJvcikgewogICAgY29uc29sZS53YXJuKGVycm9yLm1lc3NhZ2UpOwogIH0KfQpmdW5jdGlvbiB3aXJlRm9ybXMoKSB7CiAgJCgiI2xvZ2luLXRhYiIpPy5hZGRFdmVudExpc3RlbmVyKCJjbGljayIsICgpID0+IHsKICAgICQoIiNsb2dpbi10YWIiKS5jbGFzc0xpc3QuYWRkKCJhY3RpdmUiKTsgJCgiI3NpZ251cC10YWIiKS5jbGFzc0xpc3QucmVtb3ZlKCJhY3RpdmUiKTsKICAgICQoIiNsb2dpbi1mb3JtIikuaGlkZGVuID0gZmFsc2U7ICQoIiNzaWdudXAtZm9ybSIpLmhpZGRlbiA9IHRydWU7ICQoIiNhdXRoLW1lc3NhZ2UiKS50ZXh0Q29udGVudCA9ICIiOwogIH0pOwogICQoIiNzaWdudXAtdGFiIik/LmFkZEV2ZW50TGlzdGVuZXIoImNsaWNrIiwgKCkgPT4gewogICAgJCgiI3NpZ251cC10YWIiKS5jbGFzc0xpc3QuYWRkKCJhY3RpdmUiKTsgJCgiI2xvZ2luLXRhYiIpLmNsYXNzTGlzdC5yZW1vdmUoImFjdGl2ZSIpOwogICAgJCgiI3NpZ251cC1mb3JtIikuaGlkZGVuID0gZmFsc2U7ICQoIiNsb2dpbi1mb3JtIikuaGlkZGVuID0gdHJ1ZTsgJCgiI2F1dGgtbWVzc2FnZSIpLnRleHRDb250ZW50ID0gIiI7CiAgfSk7CiAgJCgiI3NpZ251cC1mb3JtIik/LmFkZEV2ZW50TGlzdGVuZXIoInN1Ym1pdCIsIGFzeW5jIChldmVudCkgPT4gewogICAgZXZlbnQucHJldmVudERlZmF1bHQoKTsKICAgIGNvbnN0IGZvcm0gPSBldmVudC5jdXJyZW50VGFyZ2V0OwogICAgdHJ5IHsKICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXBpKCIvYXBpL2F1dGgvc2lnbnVwIiwgeyBtZXRob2Q6ICJQT1NUIiwgYm9keTogSlNPTi5zdHJpbmdpZnkoT2JqZWN0LmZyb21FbnRyaWVzKG5ldyBGb3JtRGF0YShmb3JtKSkpIH0pOwogICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0b2tlbktleSwgcmVzdWx0LmFjY2Vzc190b2tlbik7CiAgICAgIHNob3dQb3J0YWwoKTsKICAgIH0gY2F0Y2ggKGVycm9yKSB7ICQoIiNhdXRoLW1lc3NhZ2UiKS50ZXh0Q29udGVudCA9IGVycm9yLm1lc3NhZ2U7IH0KICB9KTsKICAkKCIjbG9naW4tZm9ybSIpPy5hZGRFdmVudExpc3RlbmVyKCJzdWJtaXQiLCBhc3luYyAoZXZlbnQpID0+IHsKICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7CiAgICBjb25zdCBmb3JtID0gZXZlbnQuY3VycmVudFRhcmdldDsKICAgIHRyeSB7CiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFwaSgiL2FwaS9hdXRoL2xvZ2luIiwgeyBtZXRob2Q6ICJQT1NUIiwgYm9keTogSlNPTi5zdHJpbmdpZnkoT2JqZWN0LmZyb21FbnRyaWVzKG5ldyBGb3JtRGF0YShmb3JtKSkpIH0pOwogICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0b2tlbktleSwgcmVzdWx0LmFjY2Vzc190b2tlbik7CiAgICAgIHNob3dQb3J0YWwoKTsKICAgIH0gY2F0Y2ggKGVycm9yKSB7ICQoIiNhdXRoLW1lc3NhZ2UiKS50ZXh0Q29udGVudCA9IGVycm9yLm1lc3NhZ2U7IH0KICB9KTsKICAkKCIjam9iLWZvcm0iKT8uYWRkRXZlbnRMaXN0ZW5lcigic3VibWl0IiwgYXN5bmMgKGV2ZW50KSA9PiB7CiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpOwogICAgY29uc3QgZm9ybSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7CiAgICBjb25zdCBkYXRhID0gT2JqZWN0LmZyb21FbnRyaWVzKG5ldyBGb3JtRGF0YShmb3JtKSk7CiAgICBkYXRhLnRhcmdldHMgPSBbInlvdXR1YmUiLCAiaW5zdGFncmFtIl0uZmlsdGVyKChwcm92aWRlcikgPT4gZGF0YVtwcm92aWRlcl0gPT09ICJvbiIpOwogICAgZGVsZXRlIGRhdGEueW91dHViZTsgZGVsZXRlIGRhdGEuaW5zdGFncmFtOwogICAgdHJ5IHsKICAgICAgYXdhaXQgYXBpKCIvYXBpL2pvYnMiLCB7IG1ldGhvZDogIlBPU1QiLCBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSB9KTsKICAgICAgZm9ybS5yZXNldCgpOyBhd2FpdCBsb2FkRGFzaGJvYXJkKCk7ICQoIiNqb2ItbWVzc2FnZSIpLnRleHRDb250ZW50ID0gIkpvYiBxdWV1ZWQgc3VjY2Vzc2Z1bGx5LiI7CiAgICB9IGNhdGNoIChlcnJvcikgeyAkKCIjam9iLW1lc3NhZ2UiKS50ZXh0Q29udGVudCA9IGVycm9yLm1lc3NhZ2U7IH0KICB9KTsKICAkKCIjbG9nb3V0Iik/LmFkZEV2ZW50TGlzdGVuZXIoImNsaWNrIiwgYXN5bmMgKCkgPT4gewogICAgdHJ5IHsgYXdhaXQgYXBpKCIvYXBpL2F1dGgvbG9nb3V0IiwgeyBtZXRob2Q6ICJQT1NUIiB9KTsgfSBjYXRjaCB7IC8qIGxvY2FsIGxvZ291dCBzdGlsbCBzdWNjZWVkcyAqLyB9CiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0b2tlbktleSk7CiAgICBzaG93QXV0aCgpOwogIH0pOwp9CmFzeW5jIGZ1bmN0aW9uIGJvb3RzdHJhcCgpIHsKICB3aXJlRm9ybXMoKTsKICBpZiAoIXRva2VuKCkpIHJldHVybiBzaG93QXV0aCgpOwogIHRyeSB7IGF3YWl0IGFwaSgiL2FwaS9hdXRoL21lIik7IHNob3dQb3J0YWwoKTsgfQogIGNhdGNoIHsgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odG9rZW5LZXkpOyBzaG93QXV0aCgpOyB9Cn0KYm9vdHN0cmFwKCk7Cg=="},"/styles.css":{"type":"text/css; charset=utf-8","body":"OnJvb3R7Zm9udC1mYW1pbHk6SW50ZXIsdWktc2Fucy1zZXJpZixzeXN0ZW0tdWksLWFwcGxlLXN5c3RlbSxCbGlua01hY1N5c3RlbUZvbnQsIlNlZ29lIFVJIixzYW5zLXNlcmlmO2NvbG9yOiMxNzIwMmE7YmFja2dyb3VuZDojZjZmOGZiO2xpbmUtaGVpZ2h0OjEuNTtmb250LXN5bnRoZXNpczpub25lfSp7Ym94LXNpemluZzpib3JkZXItYm94fWh0bWx7c2Nyb2xsLWJlaGF2aW9yOnNtb290aH1ib2R5e21hcmdpbjowfS50b3BiYXJ7aGVpZ2h0OjY4cHg7cGFkZGluZzowIDd2dztkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoyMHB4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2JhY2tncm91bmQ6I2ZmZjtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZTdlYmYwO3Bvc2l0aW9uOnN0aWNreTt0b3A6MDt6LWluZGV4OjV9LmJyYW5ke2ZvbnQtd2VpZ2h0OjgwMDtsZXR0ZXItc3BhY2luZzotLjAzZW07Y29sb3I6IzExMTt0ZXh0LWRlY29yYXRpb246bm9uZX0udG9wYmFyIG5hdntkaXNwbGF5OmZsZXg7Z2FwOjI0cHh9LnRvcGJhciBuYXYgYXtjb2xvcjojNjY3MDg1O3RleHQtZGVjb3JhdGlvbjpub25lO2ZvbnQtc2l6ZToxNHB4fS50ZXh0LWJ1dHRvbntib3JkZXI6MDtiYWNrZ3JvdW5kOm5vbmU7Y29sb3I6IzY2NzA4NTtjdXJzb3I6cG9pbnRlcn0uc2hlbGx7bWF4LXdpZHRoOjExMjBweDttYXJnaW46MCBhdXRvO3BhZGRpbmc6NTBweCAyNHB4IDgwcHh9LmF1dGh7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczoxLjM1ZnIgLjY1ZnI7Z2FwOjQ4cHg7YWxpZ24taXRlbXM6Y2VudGVyO21pbi1oZWlnaHQ6NTIwcHh9LmF1dGggaDF7Zm9udC1zaXplOmNsYW1wKDQycHgsNnZ3LDcwcHgpO2xpbmUtaGVpZ2h0OjEuMDI7bGV0dGVyLXNwYWNpbmc6LS4wNTVlbTttYXgtd2lkdGg6NzIwcHg7bWFyZ2luOjAgMCAyMnB4fS5leWVicm93e21hcmdpbjowIDAgMTBweDtmb250LXNpemU6MTFweDtmb250LXdlaWdodDo4MDA7bGV0dGVyLXNwYWNpbmc6LjE0ZW07Y29sb3I6IzY2NzA4NX0uaGVyby1jb3B5e2ZvbnQtc2l6ZToxOXB4O2NvbG9yOiM2NjcwODU7bWF4LXdpZHRoOjYyMHB4O21hcmdpbjowfS5hdXRoLWNhcmR7YmFja2dyb3VuZDojZmZmO2JvcmRlcjoxcHggc29saWQgI2U3ZWJmMDtib3JkZXItcmFkaXVzOjE4cHg7cGFkZGluZzoyNHB4O2JveC1zaGFkb3c6MCAxNXB4IDQwcHggcmdiYSgxNywxNywxNywuMDYpfS50YWJze2Rpc3BsYXk6ZmxleDtnYXA6NHB4O21hcmdpbi1ib3R0b206MjBweDtiYWNrZ3JvdW5kOiNmNmY3Zjk7cGFkZGluZzo0cHg7Ym9yZGVyLXJhZGl1czoxMHB4fS50YWJ7ZmxleDoxO2JvcmRlcjowO2JhY2tncm91bmQ6dHJhbnNwYXJlbnQ7cGFkZGluZzo5cHg7Ym9yZGVyLXJhZGl1czo3cHg7Y3Vyc29yOnBvaW50ZXI7Y29sb3I6IzY2NzA4NX0udGFiLmFjdGl2ZXtiYWNrZ3JvdW5kOiNmZmY7Y29sb3I6IzExMTtib3gtc2hhZG93OjAgMXB4IDNweCByZ2JhKDAsMCwwLC4wOCl9Zm9ybXtkaXNwbGF5OmdyaWQ7Z2FwOjEycHh9aW5wdXQsdGV4dGFyZWF7d2lkdGg6MTAwJTtib3JkZXI6MXB4IHNvbGlkICNkZmUzZTg7Ym9yZGVyLXJhZGl1czoxMHB4O3BhZGRpbmc6MTJweCAxM3B4O2ZvbnQ6aW5oZXJpdDtiYWNrZ3JvdW5kOiNmZmZ9dGV4dGFyZWF7bWluLWhlaWdodDoxMDBweDtyZXNpemU6dmVydGljYWx9LmJ1dHRvbntkaXNwbGF5OmlubGluZS1ibG9jaztib3JkZXI6MDtwYWRkaW5nOjEycHggMThweDtib3JkZXItcmFkaXVzOjEwcHg7dGV4dC1kZWNvcmF0aW9uOm5vbmU7Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc2l6ZToxNHB4O2N1cnNvcjpwb2ludGVyfS5wcmltYXJ5e2JhY2tncm91bmQ6IzExMTtjb2xvcjojZmZmfS5zZWN0aW9ue21hcmdpbi10b3A6MzJweDtwYWRkaW5nOjM0cHg7YmFja2dyb3VuZDojZmZmO2JvcmRlcjoxcHggc29saWQgI2U3ZWJmMDtib3JkZXItcmFkaXVzOjE4cHh9LnNlY3Rpb24taGVhZGluZ3tkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47YWxpZ24taXRlbXM6Y2VudGVyO21hcmdpbi1ib3R0b206MjZweH0uc2VjdGlvbiBoMnttYXJnaW46MDtmb250LXNpemU6MjZweDtsZXR0ZXItc3BhY2luZzotLjAzZW19LnBpbGx7ZGlzcGxheTppbmxpbmUtZmxleDtwYWRkaW5nOjVweCA5cHg7Ym9yZGVyLXJhZGl1czo5OTlweDtiYWNrZ3JvdW5kOiNlZWYxZjU7Y29sb3I6IzQ3NTQ2Nztmb250LXNpemU6MTFweDtmb250LXdlaWdodDo4MDB9LnN0YXRze2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDQsMWZyKTtnYXA6MTJweH0uc3RhdHMgYXJ0aWNsZXtwYWRkaW5nOjIwcHg7Ym9yZGVyOjFweCBzb2xpZCAjZWRmMGYzO2JvcmRlci1yYWRpdXM6MTRweH0uc3RhdHMgc3Bhbiwuc3RhdHMgc21hbGx7ZGlzcGxheTpibG9jaztjb2xvcjojNjY3MDg1O2ZvbnQtc2l6ZToxM3B4fS5zdGF0cyBzdHJvbmd7ZGlzcGxheTpibG9jaztmb250LXNpemU6MzBweDtsZXR0ZXItc3BhY2luZzotLjA0ZW07bWFyZ2luOjEwcHggMCAzcHh9LnNldHVwLWdyaWR7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczouOGZyIDEuMmZyO2dhcDo0MnB4fS5tdXRlZHtjb2xvcjojNjY3MDg1fS5jb25uZWN0aW9uc3tkaXNwbGF5OmdyaWQ7Z2FwOjEwcHh9LmNvbm5lY3Rpb257ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtwYWRkaW5nOjE4cHg7Ym9yZGVyOjFweCBzb2xpZCAjZWRmMGYzO2JvcmRlci1yYWRpdXM6MTJweH0uY29ubmVjdGlvbiBzbWFsbHtkaXNwbGF5OmJsb2NrO2NvbG9yOiM5OGEyYjM7bWFyZ2luLXRvcDozcHh9LmVtcHR5e3RleHQtYWxpZ246Y2VudGVyO3BhZGRpbmc6NDZweCAyMHB4O2JvcmRlcjoxcHggZGFzaGVkICNkOGRkZTU7Ym9yZGVyLXJhZGl1czoxMnB4fS5lbXB0eSBwe2NvbG9yOiM2NjcwODU7bWFyZ2luOjZweCAwIDB9LmpvYntkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoyMHB4O3BhZGRpbmc6MTZweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZWRmMGYzfS5qb2Igc21hbGx7ZGlzcGxheTpibG9jaztjb2xvcjojOThhMmIzO292ZXJmbG93OmhpZGRlbjt0ZXh0LW92ZXJmbG93OmVsbGlwc2lzO3doaXRlLXNwYWNlOm5vd3JhcDttYXgtd2lkdGg6NjUwcHh9LmNoZWNrc3tkaXNwbGF5OmZsZXg7Z2FwOjIwcHh9LmNoZWNrcyBsYWJlbHtmb250LXNpemU6MTRweDtjb2xvcjojNDc1NDY3fS5jaGVja3MgaW5wdXR7d2lkdGg6YXV0bzttYXJnaW4tcmlnaHQ6NnB4fWZvb3RlcntwYWRkaW5nOjI0cHggN3Z3O2JvcmRlci10b3A6MXB4IHNvbGlkICNlN2ViZjA7YmFja2dyb3VuZDojZmZmO2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbjtjb2xvcjojOThhMmIzO2ZvbnQtc2l6ZToxMnB4fUBtZWRpYShtYXgtd2lkdGg6NzYwcHgpey50b3BiYXIgbmF2e2Rpc3BsYXk6bm9uZX0uYXV0aCwuc2V0dXAtZ3JpZHtncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyfS5hdXRoe21pbi1oZWlnaHQ6YXV0bztwYWRkaW5nOjMwcHggMH0uc3RhdHN7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjFmciAxZnJ9LnNlY3Rpb257cGFkZGluZzoyNHB4fX1AbWVkaWEobWF4LXdpZHRoOjQ0MHB4KXsuc3RhdHN7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjFmcn0uY2hlY2tze2Rpc3BsYXk6Z3JpZDtnYXA6OHB4fWZvb3RlcntkaXNwbGF5OmJsb2NrfWZvb3RlciBzcGFue2Rpc3BsYXk6YmxvY2s7bWFyZ2luOjRweCAwfX0="}};
function inlineAsset(pathname) {
  const asset = INLINE_ASSETS[pathname === "/" ? "/index.html" : pathname];
  if (!asset) return null;
  const binary = atob(asset.body);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Response(bytes, { headers: { "content-type": asset.type, "cache-control": "public, max-age=300" } });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}
function id(prefix) { return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`; }
function now() { return new Date().toISOString(); }
function hex(bytes) { return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
function bytesFromHex(value) {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
async function sha256(value) { return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value))); }
async function passwordHash(password, saltHex = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: bytesFromHex(saltHex), iterations: 100000 }, key, 256);
  return `v1:${saltHex}:${hex(bits)}`;
}
async function verifyPassword(password, stored) {
  const [version, salt, expected] = String(stored || "").split(":");
  if (version !== "v1" || !salt || !expected) return false;
  const actual = await passwordHash(password, salt);
  const actualHash = await sha256(actual);
  const expectedHash = await sha256(`v1:${salt}:${expected}`);
  let diff = actualHash.length ^ expectedHash.length;
  for (let i = 0; i < Math.min(actualHash.length, expectedHash.length); i += 1) diff |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  return diff === 0;
}
async function sameSecret(actual, expected) {
  if (!actual || !expected) return false;
  const [a, b] = await Promise.all([sha256(actual), sha256(expected)]);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function safeUser(user) { return user ? { id: user.id, email: user.email, display_name: user.display_name } : null; }
function safeClient(client) { return client ? { id: client.id, name: client.name, status: client.status, created_at: client.created_at } : null; }
async function body(request) {
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 32768) throw new Error("payload_too_large");
  const text = await request.text();
  if (text.length > 32768) throw new Error("payload_too_large");
  if (!text) return {};
  try { return JSON.parse(text); } catch { throw new Error("invalid_json"); }
}
async function currentContext(request, env) {
  const value = request.headers.get("authorization") || "";
  if (!value.startsWith("Bearer ")) return null;
  const tokenHash = await sha256(value.slice(7));
  const row = await env.DB.prepare(`SELECT u.id, u.email, u.display_name, c.id AS client_id, c.name AS client_name, c.status AS client_status, c.created_at AS client_created_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    JOIN memberships m ON m.user_id = u.id JOIN clients c ON c.id = m.client_id
    WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`).bind(tokenHash, now()).first();
  if (!row) return null;
  return {
    user: { id: row.id, email: row.email, display_name: row.display_name },
    client: { id: row.client_id, name: row.client_name, status: row.client_status, created_at: row.client_created_at }
  };
}
async function createSession(userId, env) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare("INSERT INTO sessions (id, token_hash, user_id, expires_at) VALUES (?, ?, ?, ?)")
    .bind(id("ses"), await sha256(token), userId, new Date(Date.now() + SESSION_TTL_MS).toISOString()).run();
  return token;
}
async function sendToMake(job, env) {
  if (!env.MAKE_WEBHOOK_URL) return { sent: false, reason: "MAKE_WEBHOOK_URL not configured" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(env.MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "publishing.job.created", job_id: job.id, client_id: job.client_id,
        source_file_url: job.source_file_url, title: job.title, description: job.description,
        targets: job.targets, callback_url: `${env.APP_BASE_URL || new URL(job.request_url).origin}/api/make/callback`
      }),
      signal: controller.signal
    });
    return { sent: response.ok, status: response.status };
  } finally { clearTimeout(timer); }
}
async function handleApi(request, env) {
  const url = new URL(request.url);
  const route = url.pathname;
  if (request.method === "GET" && route === "/api/health") {
    const plan = await env.DB.prepare("SELECT id FROM plans WHERE id = ?").bind("free").first();
    return json({ ok: Boolean(plan), service: "client-social-saas-api", persistence: "d1" });
  }
  if (request.method === "POST" && route === "/api/auth/signup") {
    let input; try { input = await body(request); } catch (error) { return json({ error: error.message }, error.message === "payload_too_large" ? 413 : 400); }
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    const displayName = String(input.display_name || "").trim().slice(0, 120);
    const clientName = String(input.client_name || `${displayName || "My"} Workspace`).trim().slice(0, 160);
    if (!email || !email.includes("@") || email.length > 320) return json({ error: "valid_email_required" }, 400);
    if (password.length < 8 || password.length > 1024) return json({ error: "password_min_8_characters" }, 400);
    const userId = id("usr"), clientId = id("cli");
    try {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO users (id, email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
          .bind(userId, email, displayName, await passwordHash(password), now()),
        env.DB.prepare("INSERT INTO clients (id, name, owner_user_id, status, created_at) VALUES (?, ?, ?, 'active', ?)")
          .bind(clientId, clientName, userId, now()),
        env.DB.prepare("INSERT INTO memberships (id, client_id, user_id, role) VALUES (?, ?, ?, 'owner')")
          .bind(id("mem"), clientId, userId),
        env.DB.prepare("INSERT INTO subscriptions (id, client_id, plan_id, status) VALUES (?, ?, 'free', 'active')")
          .bind(id("sub"), clientId)
      ]);
    } catch (error) {
      if (String(error.message).toLowerCase().includes("unique")) return json({ error: "email_already_exists" }, 409);
      throw error;
    }
    return json({ user: { id: userId, email, display_name: displayName }, client: { id: clientId, name: clientName, status: "active" }, access_token: await createSession(userId, env) }, 201);
  }
  if (request.method === "POST" && route === "/api/auth/login") {
    let input; try { input = await body(request); } catch { return json({ error: "invalid_json" }, 400); }
    const email = String(input.email || "").trim().toLowerCase();
    const user = await env.DB.prepare("SELECT id, email, display_name, password_hash FROM users WHERE email = ?").bind(email).first();
    if (!user || !(await verifyPassword(String(input.password || ""), user.password_hash))) return json({ error: "invalid_credentials" }, 401);
    const context = await env.DB.prepare("SELECT c.id, c.name, c.status, c.created_at FROM memberships m JOIN clients c ON c.id = m.client_id WHERE m.user_id = ? LIMIT 1").bind(user.id).first();
    return json({ user: safeUser(user), client: safeClient(context), access_token: await createSession(user.id, env) });
  }
  if (request.method === "POST" && route === "/api/auth/logout") {
    const value = request.headers.get("authorization") || "";
    if (value.startsWith("Bearer ")) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(value.slice(7))).run();
    return json({ ok: true });
  }
  if (request.method === "POST" && route === "/api/make/callback") {
    if (!(await sameSecret(request.headers.get("x-make-secret"), env.MAKE_CALLBACK_SECRET))) return json({ error: "invalid_callback_auth" }, 401);
    let input; try { input = await body(request); } catch { return json({ error: "invalid_json" }, 400); }
    const job = await env.DB.prepare("SELECT id, client_id, status, started_at, completed_at FROM publishing_jobs WHERE id = ?").bind(String(input.job_id || "")).first();
    if (!job) return json({ error: "job_not_found" }, 404);
    if (input.client_id !== job.client_id) return json({ error: "client_mismatch" }, 403);
    const status = ["queued", "processing", "published", "failed"].includes(input.status) ? input.status : job.status;
    const timestamp = now();
    await env.DB.prepare("UPDATE publishing_jobs SET status = ?, error_message = ?, started_at = CASE WHEN ? = 'processing' AND started_at IS NULL THEN ? ELSE started_at END, completed_at = CASE WHEN ? IN ('published','failed') AND completed_at IS NULL THEN ? ELSE completed_at END WHERE id = ?")
      .bind(status, input.error_message ? String(input.error_message).slice(0, 1000) : null, status, timestamp, status, timestamp, job.id).run();
    return json({ ok: true, job_id: job.id, status });
  }
  const context = await currentContext(request, env);
  if (!context) return json({ error: "authentication_required" }, 401);
  if (request.method === "GET" && route === "/api/auth/me") return json({ user: safeUser(context.user), client: safeClient(context.client) });
  if (request.method === "GET" && route === "/api/client") return json({ client: safeClient(context.client) });
  if (request.method === "PATCH" && route === "/api/client") {
    let input; try { input = await body(request); } catch { return json({ error: "invalid_json" }, 400); }
    const name = typeof input.name === "string" && input.name.trim() ? input.name.trim().slice(0, 160) : context.client.name;
    const status = ["active", "paused"].includes(input.status) ? input.status : context.client.status;
    await env.DB.prepare("UPDATE clients SET name = ?, status = ? WHERE id = ?").bind(name, status, context.client.id).run();
    return json({ client: { ...context.client, name, status } });
  }
  if (request.method === "GET" && route === "/api/connections") return json({ connections: ["youtube", "instagram"].map((provider) => ({ provider, status: "disconnected" })) });
  if (request.method === "GET" && route === "/api/jobs") {
    const { results } = await env.DB.prepare("SELECT id, client_id, source_file_url, title, description, status, targets_json, requested_at, started_at, completed_at, error_message FROM publishing_jobs WHERE client_id = ? ORDER BY requested_at DESC LIMIT 100").bind(context.client.id).all();
    return json({ jobs: results.map((job) => ({ ...job, targets: JSON.parse(job.targets_json) })) });
  }
  if (request.method === "POST" && route === "/api/jobs") {
    let input; try { input = await body(request); } catch { return json({ error: "invalid_json" }, 400); }
    const source = String(input.source_file_url || "").trim();
    const targets = Array.isArray(input.targets) ? input.targets.filter((target) => target === "youtube" || target === "instagram") : ["youtube", "instagram"];
    if (!source || source.length > 2048) return json({ error: "source_file_url_required" }, 400);
    if (!targets.length) return json({ error: "at_least_one_target_required" }, 400);
    const subscription = await env.DB.prepare("SELECT p.monthly_job_limit FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.client_id = ? AND s.status = 'active' AND p.enabled = 1").bind(context.client.id).first();
    const periodStart = new Date(); periodStart.setUTCDate(1); periodStart.setUTCHours(0, 0, 0, 0);
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM publishing_jobs WHERE client_id = ? AND requested_at >= ?").bind(context.client.id, periodStart.toISOString()).first();
    if (subscription && Number(count.count) >= subscription.monthly_job_limit) return json({ error: "monthly_job_limit_reached", limit: subscription.monthly_job_limit }, 429);
    const job = { id: id("job"), client_id: context.client.id, source_file_url: source, title: String(input.title || "").slice(0, 500), description: String(input.description || "").slice(0, 5000), targets, status: "queued", requested_at: now(), started_at: null, completed_at: null, error_message: null, request_url: request.url };
    await env.DB.prepare("INSERT INTO publishing_jobs (id, client_id, source_file_url, title, description, status, targets_json, requested_at, started_at, completed_at, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)")
      .bind(job.id, job.client_id, job.source_file_url, job.title, job.description, job.status, JSON.stringify(job.targets), job.requested_at).run();
    try { job.make = await sendToMake(job, env); } catch { job.make = { sent: false, reason: "make_request_failed" }; }
    delete job.request_url;
    return json({ job }, 201);
  }
  return json({ error: "not_found" }, 404);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env);
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return inlineAsset(url.pathname) || new Response("Not found", { status: 404 });
    } catch (error) {
      console.error(JSON.stringify({ event: "request_error", route: url.pathname, message: String(error.message || error) }));
      return json({ error: "internal_server_error" }, 500);
    }
  }
};