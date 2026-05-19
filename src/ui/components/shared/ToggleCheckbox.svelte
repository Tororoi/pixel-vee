<script>
  /**
   * @component
   * Styled toggle checkbox wrapping a native checkbox input with a
   * custom visual checkmark. All behaviour — checked state, change
   * handler, tooltip, and accessible label — is controlled by the
   * parent via props. The optional `labelId` prop lets external
   * elements reference this label by id for aria relationships.
   */
  let {
    id,
    labelId = undefined,
    label,
    checked,
    onchange,
    tooltip = undefined,
    tooltipPosition = undefined,
    name = undefined,
  } = $props()
</script>

<label
  for={id}
  id={labelId}
  class="toggle"
  data-tooltip={tooltip}
  data-tooltip-position={tooltipPosition}
>
  <input type="checkbox" {id} {name} {checked} {onchange} />
  <span class="checkmark"></span>
  <span>{label}</span>
</label>
