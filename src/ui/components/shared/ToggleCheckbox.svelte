<script>
  let {
    id,
    labelId = undefined,
    label,
    checked,
    onchange,
    tooltip = undefined,
    name = undefined,
  } = $props()
</script>

<label for={id} id={labelId} class="toggle" data-tooltip={tooltip}>
  <input type="checkbox" {id} {name} {checked} {onchange} />
  <span class="checkmark"></span>
  <span>{label}</span>
</label>
